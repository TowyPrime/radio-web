import { NextResponse } from "next/server";
import { getCurrentVisitor } from "@/utils/supabase/service";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 },
      );
    }

    if (trimmedMessage.length < 3) {
      return NextResponse.json(
        { error: "El mensaje debe tener al menos 3 caracteres" },
        { status: 400 },
      );
    }

    if (trimmedMessage.length > 100) {
      return NextResponse.json(
        { error: "El mensaje no puede superar los 100 caracteres" },
        { status: 400 },
      );
    }

    const supabase = await createServiceRoleClient();
    const visitor = await getCurrentVisitor();

    if (!visitor) {
      return NextResponse.json(
        {
          error:
            "Se requiere un visitante identificado para realizar esta acción",
        },
        { status: 401 },
      );
    }

    const visitorUid = visitor.visitorUid;
    const username = visitor.username;

    //Insertar mensaje
    const { data, error } = await supabase
      .from("messages")
      .insert({
        visitor_uid: visitorUid,
        message: trimmedMessage,
      })
      .select("message, created_at")
      .single();

    if (error) {
      if (error.code === "23514") {
        return NextResponse.json(
          { error: "El comentario no cumple con los criterios de longitud" },
          { status: 400 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        chatMessage: {
          ...data,
          username,
        },
      },
      { status: 201 },
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
