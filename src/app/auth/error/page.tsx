import Link from "next/link";
import { ADMIN_LOGIN_PATH } from "@/lib/auth/paths";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icono o indicador visual */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Error de autenticación
          </h2>
          <p className="mt-2 text-sm text-ink-400">
            No pudimos verificar tu identidad o el enlace de acceso ha expirado o ya fue utilizado.
          </p>
        </div>

        {/* Acciones para el usuario */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={ADMIN_LOGIN_PATH}
            className="flex w-full justify-center rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Volver a iniciar sesión
          </Link>
          
          <Link
            href="/"
            className="flex w-full justify-center rounded-md bg-ink-900 px-3 py-2 text-sm font-semibold text-ink-100 shadow-sm ring-1 ring-inset ring-ink-700 hover:bg-ink-800"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}