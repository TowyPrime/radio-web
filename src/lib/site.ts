export const SITE_NAME = "Con el pie derecho radio";
export const SITE_DESCRIPTION = "La mejor emisora";

// Redes de la emisora que se muestran en /contact.
// TODO: reemplazar cada `href` por la dirección real (hoy apuntan a la página principal de cada red).
export const SOCIAL_LINKS = [
  {
    id: "facebook",
    label: "Facebook",
    description: "Síguenos en nuestra página",
    href: "https://www.facebook.com",
  },
  {
    id: "spotify",
    label: "Spotify",
    description: "Escucha nuestro podcast",
    href: "https://open.spotify.com",
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "Mira nuestros directos y videos",
    href: "https://www.youtube.com",
  },
] as const;

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
