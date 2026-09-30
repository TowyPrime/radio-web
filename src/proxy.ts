// proxy.ts (antes middleware.ts, convención renombrada en Next 16)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { ensureAdminVisitor } from './utils/supabase/service';

export async function proxy(request: NextRequest) {
  const session = await updateSession(request) 
  
  const supabaseResponse = session.supabaseResponse;
  const user = session.user;
  await ensureAdminVisitor(request, supabaseResponse, user);

  return supabaseResponse;

}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
