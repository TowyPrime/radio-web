import { NextResponse } from "next/server";
import { getCurrentVisitor } from "@/utils/supabase/service";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, storyId } = body;

    if (!["like", "unlike"].includes(action)) {
      return NextResponse.json(
        { error: "la acción debe contener like o unlike" },
        { status: 400 },
      );
    }

    if (!storyId) {
      return NextResponse.json(
        { error: "El id de historia es obligatorio" },
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

    if (action === "like") {
      const { error } = await supabase
        .from("likes")
        .insert({ visitor_uid: visitorUid, story_id: storyId });

      if (error) {
        // si el like existe se ignora y se trata como exitoso
        if (error.code === "23505") {
          return NextResponse.json(
            { success: true, action: "like" },
            { status: 200 },
          );
        }

        // Código 23503: El story_id no existe
        if (error.code === "23503") {
          return NextResponse.json(
            { error: "La historia especificada no existe." },
            { status: 400 },
          );
        }


        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, action: "like" },
        { status: 200 },
      );
    }

    if (action === "unlike") {
      const { error } = await supabase
        .from("likes")
        .delete()
        .match({ visitor_uid: visitorUid, story_id: storyId });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, action: "unlike" },
        { status: 200 },
      );
    }
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
