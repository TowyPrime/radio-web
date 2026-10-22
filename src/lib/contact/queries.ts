import { createServiceRoleClient } from "@/utils/supabase/service";
import type { ContactMessage } from "./types";

const MAX_MESSAGES_LISTED = 200;

// Solo se usa en el servidor, desde páginas y rutas de administración (la tabla está cerrada
// con RLS, por eso se lee con la llave service_role)
export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES_LISTED);

  if (error) {
    console.error("Error al obtener los mensajes de contacto:", error);
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getUnreadContactCount(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("Error al contar los mensajes sin leer:", error);
    throw new Error(error.message);
  }

  return count ?? 0;
}
