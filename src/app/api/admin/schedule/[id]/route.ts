import { UUID_REGEX } from "@/lib/tracks/constants";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

export async function DELETE(
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

    const { id: slotId } = await params;

    if (typeof slotId !== "string" || !UUID_REGEX.test(slotId)) {
      return NextResponse.json(
        { error: "El id del horario no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("schedule_slots")
      .delete()
      .eq("id", slotId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error al cancelar el horario:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al cancelar el horario" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró el horario especificado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Horario cancelado correctamente" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error inesperado en DELETE api/admin/schedule/[id]:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
