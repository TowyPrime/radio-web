import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";

import { requireAdmin } from "@/utils/supabase/adminGuard";

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }
    const body = await request.json();

    const { email: emailToInvite } = body;

    if(!emailToInvite){
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      );
    }
    if (typeof emailToInvite !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico debe ser una cadena de texto" },
        { status: 400 }
      );
    }
    const admin = createServiceRoleClient();

    const redirectToUrl = new URL(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    );
    redirectToUrl.searchParams.set("next", "/profile");

    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(emailToInvite, {
        redirectTo: redirectToUrl.toString(),
      });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Invitación enviada correctamente",
        user: inviteData.user,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "El formato del cuerpo de la petición es inválido" },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado en el servidor";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
