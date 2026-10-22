import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { UUID_REGEX } from "@/lib/tracks/constants";

export const dynamic = "force-dynamic";

// Marca un mensaje como leído o como no leído: body { read: boolean }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "El id del mensaje no tiene un formato válido" },
        { status: 400 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El formato del cuerpo de la petición es inválido" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "El cuerpo de la petición es requerido y debe ser un objeto" },
        { status: 400 },
      );
    }

    const { read } = body as Record<string, unknown>;

    if (typeof read !== "boolean") {
      return NextResponse.json(
        { error: "El campo read debe ser verdadero o falso" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("contact_messages")
      .update({ read_at: read ? new Date().toISOString() : null })
      .eq("id", id)
      .select("id, read_at")
      .maybeSingle();

    if (error) {
      console.error("Error al actualizar el mensaje de contacto:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al actualizar el mensaje" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró el mensaje especificado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: data });
  } catch (error: unknown) {
    console.error("Error inesperado en PATCH api/admin/messages/[id]:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "El id del mensaje no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error al borrar el mensaje de contacto:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al borrar el mensaje" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró el mensaje especificado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Mensaje borrado correctamente" });
  } catch (error: unknown) {
    console.error("Error inesperado en DELETE api/admin/messages/[id]:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
