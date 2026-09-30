import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User as SupabaseUser } from "@supabase/supabase-js";

export const VISITOR_COOKIE_NAME = "visitor_token";

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan las variables de entorno para el cliente de Service Role.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getCurrentVisitor() {
  const cookieStore = await cookies();
  const visitorToken = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (!visitorToken) return null;

  const serviceSupabase = createServiceRoleClient();

  const { data, error } = await serviceSupabase
    .from("visitors")
    .select("uid, username")
    .eq("token", visitorToken)
    .single();

  if (error?.code === "PGRST116") {
    return null;
  }

  if (error) {
    throw error;
  }

  return {
    visitorUid: data.uid,
    username: data.username,
  };
}

export async function ensureAdminVisitor(
  request: NextRequest,
  response: NextResponse,
  user: SupabaseUser | null,
) {
  const cookie = request.cookies.get(VISITOR_COOKIE_NAME);
  if (cookie) return;
  if (!user) return;
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("rol, username")
    .eq("uid", user.id)
    .single();
  if (error) {
    console.error("Ocurrió un error en la consulta:", error);
    return;
  }
  if (data.rol !== "admin") return;
  const { data: newVisitor, error: errorInsert } = await supabase
    .from("visitors")
    .insert({ username: data.username })
    .select("token, username")
    .single();
  let finalVisitor = newVisitor;
  if (errorInsert) {
    if (errorInsert.code === "23505") {
      const newUsername = `${data.username}${crypto.randomUUID()}`;
      const { data: secondInsert, error: secondInsertError } = await supabase
        .from("visitors")
        .insert({ username: newUsername })
        .select("token, username")
        .single();
      if (secondInsertError) {
        console.error("No se pudo crear el visitante:", secondInsertError);
        return;
      }
      finalVisitor = secondInsert;
    } else {
      console.error("No se pudo crear el visitante:", errorInsert);
      return;
    }
  }
  if (!finalVisitor) return;
  response.cookies.set({
    name: VISITOR_COOKIE_NAME,
    value: finalVisitor.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 31536000,
  });
}
