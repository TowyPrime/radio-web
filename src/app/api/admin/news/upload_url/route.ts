import { ALLOWED_IMAGE_TYPES, NEWS_BUCKET_NAME } from "@/lib/news/constants";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

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

    const { imageType } = body;

    if (typeof imageType !== "string") {
      return NextResponse.json(
        { error: "El tipo de imagen es requerido" },
        { status: 400 },
      );
    }

    const extension = ALLOWED_IMAGE_TYPES.get(imageType);

    if (!extension) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes JPG, PNG o WEBP" },
        { status: 400 },
      );
    }

    const path = `covers/${crypto.randomUUID}.${extension}`;

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(NEWS_BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Error al generar la URL de subida de la portada:", error);
      return NextResponse.json(
        { error: "Error al generar la URL de subida" },
        { status: 500 },
      );
    }

    return NextResponse.json({ token: data.token, path: data.path });
  } catch (error: unknown) {
    console.error("Error inesperado en POST api/admin/news/upload-url:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
