export const NEWS_BUCKET_NAME = "news-images";

export const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

// Lista cerrada de categorías (definida con el cliente). En pantalla se muestran en
// mayúsculas con CSS (`uppercase`), pero se guardan tal cual están aquí.
export const NEWS_CATEGORIES = [
  "Moda",
  "Música",
  "Deportes",
  "Espectáculo",
  "Salud",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export function isNewsCategory(value: unknown): value is NewsCategory {
  return (
    typeof value === "string" &&
    (NEWS_CATEGORIES as readonly string[]).includes(value)
  );
}

export const NEWS_LIMITS = {
  title: 120,
  summary: 300,
  authorName: 60,
} as const;

export const MAX_COVER_BYTES = 5 *1024 *1024; 