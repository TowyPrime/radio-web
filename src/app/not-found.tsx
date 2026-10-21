import Link from "next/link";
import { Radio, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-400/10 text-brand-400">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-400">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Esta página no está en el aire
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-400">
        No encontramos lo que buscabas. Puede que el enlace esté mal escrito o
        que la noticia ya no esté disponible.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex flex-1 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          Ir a las noticias
        </Link>
        <Link
          href="/live"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-ink-100 ring-1 ring-inset ring-ink-700 transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <Radio className="h-4 w-4 text-brand-400" aria-hidden="true" />
          Ver la programación
        </Link>
      </div>
    </main>
  );
}
