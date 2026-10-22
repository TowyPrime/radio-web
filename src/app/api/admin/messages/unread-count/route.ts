import { NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { getUnreadContactCount } from "@/lib/contact/queries";

export const dynamic = "force-dynamic";

// Número de mensajes de contacto sin leer (para la insignia del menú de administración)
export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const unread = await getUnreadContactCount();

    return NextResponse.json({ unread });
  } catch (error: unknown) {
    console.error("Error inesperado en GET api/admin/messages/unread-count:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
