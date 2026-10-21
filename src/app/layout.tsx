import { createClient } from "@/utils/supabase/server";
import { getCurrentVisitor } from "@/utils/supabase/service";
import Navbar from "@/components/Navbar";
import { AudioProvider } from "@/context/AudioContext";
import { VisitorProvider } from "@/context/VisitorContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import { VisitorNicknameDialog } from "@/components/VisitorNicknameDialog";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_MX",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/icon.jpg", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Leemos la cookie del visitante en el servidor
  let visitor = null;

  try {
    visitor = await getCurrentVisitor();
  } catch (err) {
    console.error("Error al obtener el visitante actual", err);
  }

  const initialUsername = visitor?.username ?? null;
  const initialVisitorUid = visitor?.visitorUid ?? null;

  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  const fechaActual = now.toLocaleDateString("es-ES", options);
  const fechaFormateada =
    fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1);

  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className="bg-ink-950 text-ink-100 min-h-screen m-0 p-0 overflow-x-hidden pb-24 sm:pb-0">
        <AudioProvider>
          {/* Envolvemos la app con el VisitorProvider pasando el initialUsername resuelto en el servidor */}
          <VisitorProvider
            initialUsername={initialUsername}
            initialVisitorUid={initialVisitorUid}
          >
            <Navbar user={user} fechaFormateada={fechaFormateada} />

            {/* Reproductor global flotante: se mantiene visible (y sonando) al navegar entre páginas */}
            <GlobalPlayer />

            {/* Renderiza el contenido de la página directamente sin restricciones de contenedor global */}
            {children}
            <VisitorNicknameDialog />
          </VisitorProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
