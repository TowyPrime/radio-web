import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Solo se aceptan rutas internas ("/algo"). Evita redirecciones a otros dominios
// como "@evil.com" o "//evil.com" a través del parámetro `next`.
function safeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/';
  }
  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirige al inicio (o a la ruta que pasaste en 'next') con el parámetro de éxito para el toast
      const separator = next.includes('?') ? '&' : '?';
      return NextResponse.redirect(`${requestUrl.origin}${next}${separator}success=true`);
    }
  }

  // Si algo falla, redirige al login o a la página de inicio con un error
  return NextResponse.redirect(`${requestUrl.origin}/?error=auth-failed`);
}
