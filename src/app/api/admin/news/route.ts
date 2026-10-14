import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { NEWS_BUCKET_NAME, NEWS_LIMITS } from "@/lib/news/constants";
import { parseNewsInput } from "@/lib/news/validate";

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
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
    const coverPath = parsed.data.cover_path ?? null;

    const supabase = createServiceRoleClient();

    let coverUrl: string | null = null;

    if (coverPath) {
      const { data: exists, error: existsError } = await supabase.storage
        .from(NEWS_BUCKET_NAME)
        .exists(coverPath);

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

      coverUrl = supabase.storage
        .from(NEWS_BUCKET_NAME)
        .getPublicUrl(coverPath).data.publicUrl;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("uid", adminCheck.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error al obtener el perfil del autor:", profileError);
      return NextResponse.json(
        { error: "No se pudo obtener el perfil del autor" },
        { status: 500 },
      );
    }

    const authorName = (profile.full_name || profile.username).slice(
      0,
      NEWS_LIMITS.authorName,
    );

    const { data, error } = await supabase
      .from("news")
      .insert({
        title,
        summary,
        category,
        body: content,
        cover_path: coverPath,
        cover_url: coverUrl,
        author_name: authorName,
      })
      .select()
      .single();

    if (error) {
      if (coverPath) {
        const { error: removeError } = await supabase.storage
          .from(NEWS_BUCKET_NAME)
          .remove([coverPath]);

        if (removeError) {
          console.error("Fallo al limpiar la portada huérfana:", removeError);
        }
      }

      if (error.code === "23514") {
        return NextResponse.json(
          { error: "Los datos proporcionados violan las restricciones de la base de datos" },
          { status: 400 },
        );
      }

      console.error("Error al crear la noticia:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al crear la noticia" },
        { status: 500 },
      );
    }

    return NextResponse.json({ news: data }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error inesperado en POST api/admin/news:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}