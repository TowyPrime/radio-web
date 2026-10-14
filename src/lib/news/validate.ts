import { ALLOWED_IMAGE_TYPES, NEWS_CATEGORIES, NEWS_LIMITS } from "./constants";
import { htmlToPlainText, sanitizeNewsHtml } from "./sanitize";

const coverExtensions = Array.from(ALLOWED_IMAGE_TYPES.values()).join("|");

export const COVER_PATH_REGEX = new RegExp(
  `^covers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${coverExtensions})$`,
  "i",
);

export interface NewsInput {
  title: string;
  summary: string;
  category: string;
  content: string;
  cover_path: string | null | undefined;
}
export type NewInputResult =
  | { ok: true; data: NewsInput }
  | { ok: false; error: string };

export function parseNewsInput(body: Record<string, unknown>): NewInputResult {
  const { title, summary, category, content, cover_path } = body;

  if (
    typeof title !== "string" ||
    typeof summary !== "string" ||
    typeof category !== "string" ||
    typeof content !== "string"
  ) {
    return {
      ok: false,
      error: "Título, resumen, categoría y contenido deben ser texto",
    };
  }

  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();

  if (trimmedTitle.length < 1 || trimmedSummary.length > NEWS_LIMITS.summary) {
    return {
      ok: false,
      error: `El resumen debe tener entre 1 y ${NEWS_LIMITS.summary} caracteres`,
    };
  }

  if (!(NEWS_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: "La categoría no es válida" };
  }

  const cleanContent = sanitizeNewsHtml(content);

  if (htmlToPlainText(cleanContent).length === 0) {
    return {
      ok: false,
      error: "El contenido de la noticia no puede estar vacío",
    };
  }

  if (cover_path !== undefined && cover_path !== null) {
    if (typeof cover_path !== "string" || !COVER_PATH_REGEX.test(cover_path)) {
      return {
        ok: false,
        error: "La ruta de la portada no tiene un formato válido",
      };
    }
  }

  return {
    ok: true,
    data: {
      title: trimmedTitle,
      summary: trimmedSummary,
      category,
      content: cleanContent,
      cover_path: cover_path as string | null | undefined,
    },
  };
}
