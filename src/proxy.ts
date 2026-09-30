// proxy.ts (antes middleware.ts, convención renombrada en Next 16)
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { ensureAdminVisitor } from "./utils/supabase/service";
import { createServiceRoleClient } from "./utils/supabase/service";

export async function proxy(request: NextRequest) {
  const session = await updateSession(request);

  const supabaseResponse = session.supabaseResponse;
  const user = session.user;
  await ensureAdminVisitor(request, supabaseResponse, user);

  const pathname = request.nextUrl.pathname;
  const isProtectRoute = ["/music", "/playlist", "/live/start", "/admin"];

  const isProtected = isProtectRoute.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtected) {
    return supabaseResponse;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("rol")
    .eq("uid", user.id)
    .single();

  if (error || !data || data.rol !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
