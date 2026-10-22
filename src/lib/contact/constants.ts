export const CONTACT_LIMITS = {
  nameMax: 80,
  emailMax: 120,
  messageMin: 10,
  messageMax: 2000,
} as const;

// Máximo de mensajes por remitente (identificado por el resumen de su IP) en una ventana de tiempo
export const CONTACT_RATE_LIMIT = {
  maxMessages: 3,
  windowMinutes: 10,
} as const;

// Campo-trampa del formulario: las personas no lo ven, los bots suelen rellenarlo
export const CONTACT_HONEYPOT_FIELD = "website";

// Sin espacios ni caracteres que permitirían alterar un enlace `mailto:` (? & # < > ")
export const CONTACT_EMAIL_REGEX = /^[^\s@?&#<>"]+@[^\s@?&#<>"]+\.[^\s@?&#<>"]+$/;

// Evento del navegador con el que el admin avisa al menú de que cambió el número de mensajes sin leer
export const CONTACT_MESSAGES_CHANGED_EVENT = "contact-messages-changed";
