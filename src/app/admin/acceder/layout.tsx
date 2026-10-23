import type { Metadata } from "next";

// La página de acceso del equipo no debe aparecer en buscadores ni mostrarse al compartirla
export const metadata: Metadata = {
  title: "Acceso",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
