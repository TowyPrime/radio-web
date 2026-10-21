"use client";

// Se muestra solo si falla el layout raíz (por ejemplo, Supabase caído al leer la sesión).
// Reemplaza al layout, así que debe traer su propio <html> y <body> y cargar los estilos.
import "./globals.css";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Error no controlado en el layout raíz:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="m-0 flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-12 text-center text-ink-100">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Algo salió mal
        </h1>
        <p className="mt-3 max-w-md text-sm text-ink-400">
          La página no se pudo cargar en este momento. Intenta de nuevo en unos
          segundos.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-ink-500">Código: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-8 cursor-pointer rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
