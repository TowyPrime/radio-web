import { User } from "@supabase/supabase-js";
import { createServiceRoleClient } from "./service";
import { createClient } from "./server";

type AdminResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient();
  const serviceRoleSupabase = createServiceRoleClient();

  const {
    data: { user: authUser },
    error: activeUserError,
  } = await supabase.auth.getUser();

  if (activeUserError || !authUser) {
    return { ok: false, status: 401, error: "No hay usuario autenticado" };
  }

  const { data: profile, error: profileError } = await serviceRoleSupabase
    .from("profiles")
    .select("rol")
    .eq("uid", authUser.id)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST116") {
      return {
        ok: false,
        status: 403,
        error: "El usuario no tiene un perfil registrado",
      };
    }
    return { ok: false, status: 500, error: "Error al obtener el perfil" };
  }

  if (profile.rol !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "El usuario no tiene permisos de administrador",
    };
  }

  return { ok: true, user: authUser };
}
