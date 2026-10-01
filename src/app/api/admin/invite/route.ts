import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No tienes una sesión activa" },
        { status: 401 },
      );
    }

    const { email: emailToInvite } = body;

    if (!emailToInvite) {
      return NextResponse.json(
        { error: 'El campo "email" es obligatorio' },
        { status: 400 },
      );
    }

    const admin = createServiceRoleClient();

    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("rol")
      .eq("uid", user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: "No se pudo obtener el perfil del usuario" },
        { status: 400 },
      );
    }

    if (profileData.rol !== "admin") {
      return NextResponse.json(
        {
          error:
            "Se requiere una cuenta de administrador para realizar esta acción",
        },
        { status: 403 },
      );
    }
     
    const redirectToUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
    redirectToUrl.searchParams.set('next', '/profile');

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
