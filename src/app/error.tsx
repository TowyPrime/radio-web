"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Error no controlado en la página:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <TriangleAlert className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Algo salió mal
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-400">
        Tuvimos un problema al cargar esta página. Puedes intentarlo de nuevo o
        volver al inicio.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink-500">Código: {error.digest}</p>
      )}

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
        <Link
          href="/"
          className="flex flex-1 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-ink-100 ring-1 ring-inset ring-ink-700 transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
