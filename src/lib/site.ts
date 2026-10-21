export const SITE_NAME = "Con el pie derecho radio";
export const SITE_DESCRIPTION = "La mejor emisora";

const DEFAULT_SITE_URL = "http://localhost:3000";

// URL pública del sitio. Las etiquetas para compartir en redes (Open Graph)
// necesitan direcciones absolutas, y de aquí sale la base para construirlas.
export function getSiteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
  } catch {
    console.error(
      "NEXT_PUBLIC_SITE_URL no es una URL válida; se usa la de desarrollo.",
    );
    return new URL(DEFAULT_SITE_URL);
  }
}
