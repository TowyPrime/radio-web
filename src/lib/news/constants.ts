export const NEWS_BUCKET_NAME = "news-images";

export const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const NEWS_CATEGORIES = [
  "EMISORA",
  "MÚSICA",
  "EVENTOS",
  "COMUNIDAD",
  "OTROS",
] as const;

export const NEWS_LIMITS = {
  title: 120,
  summary: 300,
  authorName: 60,
} as const;