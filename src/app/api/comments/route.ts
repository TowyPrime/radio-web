import { NextResponse } from "next/server";
import { getCurrentVisitor } from "@/utils/supabase/service";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyId, message } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "El id de la historia es obligatorio" },
        { status: 400 },
      );
    }

 

    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if(trimmedMessage.length === 0){
        return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

if(trimmedMessage.length < 3){
    return NextResponse.json(
        { error: "El comentario debe tener al menos 3 caracteres" },
        { status: 400 }
      );
}

if(trimmedMessage.length > 200){
    return NextResponse.json(
        { error: "El comentario no puede superar los 200 caracteres" },
        { status: 400 }
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

    //Insertar comentario
    const { data, error } = await supabase
      .from("comments")
      .insert({
        story_id: storyId,
        visitor_uid: visitorUid,
        message: message.trim(),
      })
      .select("message, created_at")
      .single();

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "La historia especificada no existe" },
          { status: 400 },
        );
      }

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
        comment: {
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
