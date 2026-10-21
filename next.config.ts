import type { NextConfig } from "next";

// next/image solo optimiza imágenes de dominios declarados aquí. Las portadas de las
// noticias viven en el Storage público de Supabase; se deduce el dominio de su URL.
function getSupabaseStoragePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  try {
    const { protocol, hostname } = new URL(supabaseUrl);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    console.error("NEXT_PUBLIC_SUPABASE_URL no es una URL válida");
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      ...getSupabaseStoragePattern(),
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
