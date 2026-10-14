import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import {
  ALLOWED_IMAGE_TYPES,
  NEWS_BUCKET_NAME,
  NEWS_CATEGORIES,
  NEWS_LIMITS,
} from "@/lib/news/constants";
import { htmlToPlainText, sanitizeNewsHtml } from "@/lib/news/sanitize";

const coverExtensions = Array.from(ALLOWED_IMAGE_TYPES.values()).join("|");
const coverPathRegex = new RegExp(
  `^covers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${coverExtensions})$`,
  "i",
);

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

    const { title, summary, category, content, cover_path } = body;

    if (
      typeof title !== "string" ||
      typeof summary !== "string" ||
      typeof category !== "string" ||
      typeof content !== "string"
    ) {
      return NextResponse.json(
        { error: "Título, resumen, categoría y contenido deben ser texto" },
        { status: 400 },
      );
    }

    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();

    if (trimmedTitle.length < 1 || trimmedTitle.length > NEWS_LIMITS.title) {
      return NextResponse.json(
        { error: `El título debe tener entre 1 y ${NEWS_LIMITS.title} caracteres` },
        { status: 400 },
      );
    }

    if (trimmedSummary.length < 1 || trimmedSummary.length > NEWS_LIMITS.summary) {
      return NextResponse.json(
        { error: `El resumen debe tener entre 1 y ${NEWS_LIMITS.summary} caracteres` },
        { status: 400 },
      );
    }

    if (!(NEWS_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json(
        { error: "La categoría no es válida" },
        { status: 400 },
      );
    }

    const cleanContent = sanitizeNewsHtml(content);

    if (htmlToPlainText(cleanContent).length === 0) {
      return NextResponse.json(
        { error: "El contenido de la noticia no puede estar vacío" },
        { status: 400 },
      );
    }

    const hasCover = cover_path !== undefined && cover_path !== null;

    if (hasCover && (typeof cover_path !== "string" || !coverPathRegex.test(cover_path))) {
      return NextResponse.json(
        { error: "La ruta de la portada no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    let coverUrl: string | null = null;

    if (hasCover) {
      const { data: exists, error: existsError } = await supabase.storage
        .from(NEWS_BUCKET_NAME)
        .exists(cover_path);

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
        .getPublicUrl(cover_path).data.publicUrl;
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
        title: trimmedTitle,
        summary: trimmedSummary,
        category,
        body: cleanContent,
        cover_path: hasCover ? cover_path : null,
        cover_url: coverUrl,
        author_name: authorName,
      })
      .select()
      .single();

    if (error) {
      if (hasCover) {
        const { error: removeError } = await supabase.storage
          .from(NEWS_BUCKET_NAME)
          .remove([cover_path]);

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