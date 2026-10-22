import { CONTACT_EMAIL_REGEX, CONTACT_LIMITS } from "./constants";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export type ContactInputResult =
  | { ok: true; data: ContactInput }
  | { ok: false; error: string };

// Validación compartida por el formulario (para avisar antes de enviar) y por la API
export function parseContactInput(
  body: Record<string, unknown>,
): ContactInputResult {
  const { name, email, message } = body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    return {
      ok: false,
      error: "El nombre, el correo y el mensaje deben ser texto",
    };
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (trimmedName.length < 1 || trimmedName.length > CONTACT_LIMITS.nameMax) {
    return {
      ok: false,
      error: `El nombre debe tener entre 1 y ${CONTACT_LIMITS.nameMax} caracteres`,
    };
  }

  if (
    trimmedEmail.length > CONTACT_LIMITS.emailMax ||
    !CONTACT_EMAIL_REGEX.test(trimmedEmail)
  ) {
    return { ok: false, error: "El correo electrónico no es válido" };
  }

  if (
    trimmedMessage.length < CONTACT_LIMITS.messageMin ||
    trimmedMessage.length > CONTACT_LIMITS.messageMax
  ) {
    return {
      ok: false,
      error: `El mensaje debe tener entre ${CONTACT_LIMITS.messageMin} y ${CONTACT_LIMITS.messageMax} caracteres`,
    };
  }

  return {
    ok: true,
    data: { name: trimmedName, email: trimmedEmail, message: trimmedMessage },
  };
}
