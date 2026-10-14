import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { UUID_REGEX } from "@/lib/tracks/constants";
import { NEWS_BUCKET_NAME } from "@/lib/news/constants";
import { parseNewsInput } from "@/lib/news/validate";

export async function PUT(
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

    const { id: newsId } = await params;

    if (typeof newsId !== "string" || !UUID_REGEX.test(newsId)) {
      return NextResponse.json(
        { error: "El id de la noticia no tiene un formato válido" },
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

    const parsed = parseNewsInput(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { title, summary, category, content } = parsed.data;
    const requestedCover = parsed.data.cover_path;

    const supabase = createServiceRoleClient();

    const { data: current, error: currentError } = await supabase
      .from("news")
      .select("id, cover_path, cover_url")
      .eq("id", newsId)
      .single();

    if (currentError) {
      if (currentError.code === "PGRST116") {
        return NextResponse.json(
          { error: "No se encontró la noticia especificada" },
          { status: 404 },
        );
      }

      console.error("Error al buscar la noticia:", currentError);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar la noticia" },
        { status: 500 },
      );
    }

    // undefined = conservar la portada actual; null = quitarla; texto = reemplazarla
    const coverChanged =
      requestedCover !== undefined && requestedCover !== current.cover_path;

    let nextCoverPath: string | null = current.cover_path;
    let nextCoverUrl: string | null = current.cover_url;

    if (coverChanged) {
      if (requestedCover === null) {
        nextCoverPath = null;
        nextCoverUrl = null;
      } else {
        const { data: exists, error: existsError } = await supabase.storage
          .from(NEWS_BUCKET_NAME)
          .exists(requestedCover);

        if (existsError) {
          console.error("Error al verificar la portada:", existsError);
          return NextResponse.json(
            { error: "Error al verificar la portada" },
            { status: 500 },
          );
        }

        if (!exists) {
          return NextResponse.json(
            { error: "La portada no existe en el almacenamiento" },
            { status: 400 },
          );
        }

        nextCoverPath = requestedCover;
        nextCoverUrl = supabase.storage
          .from(NEWS_BUCKET_NAME)
          .getPublicUrl(requestedCover).data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("news")
      .update({
        title,
        summary,
        category,
        body: content,
        cover_path: nextCoverPath,
        cover_url: nextCoverUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsId)
      .select()
      .single();

    if (error) {
      if (coverChanged && typeof requestedCover === "string") {
        const { error: removeError } = await supabase.storage
          .from(NEWS_BUCKET_NAME)
          .remove([requestedCover]);

        if (removeError) {
          console.error("Fallo al limpiar la portada nueva:", removeError);
        }
      }

      if (error.code === "23514") {
        return NextResponse.json(
          { error: "Los datos proporcionados violan las restricciones de la base de datos" },
          { status: 400 },
        );
      }

      console.error("Error al editar la noticia:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al editar la noticia" },
        { status: 500 },
      );
    }

    if (coverChanged && current.cover_path) {
      const { error: removeError } = await supabase.storage
        .from(NEWS_BUCKET_NAME)
        .remove([current.cover_path]);

      if (removeError) {
        console.error("Fallo al borrar la portada anterior:", removeError);
      }
    }

    return NextResponse.json({ news: data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error inesperado en PUT api/admin/news/[id]:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

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

    const { id: newsId } = await params;

    if (typeof newsId !== "string" || !UUID_REGEX.test(newsId)) {
      return NextResponse.json(
        { error: "El id de la noticia no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("news")
      .delete()
      .eq("id", newsId)
      .select("id, cover_path")
      .maybeSingle();

    if (error) {
      console.error("Error al borrar la noticia:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al borrar la noticia" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró la noticia especificada" },
        { status: 404 },
      );
    }

    if (data.cover_path) {
      const { error: removeError } = await supabase.storage
        .from(NEWS_BUCKET_NAME)
        .remove([data.cover_path]);

      if (removeError) {
        console.error("Fallo al borrar la portada de la noticia:", removeError);
      }
    }

    return NextResponse.json(
      { message: "Noticia eliminada correctamente" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error inesperado en DELETE api/admin/news/[id]:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}