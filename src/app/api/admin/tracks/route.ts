import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import {
  ALLOWED_FILE_TYPES,
  BUCKET_NAME,
  MAX_DURATION_SECONDS,
} from "@/lib/tracks/constants";


// Extraer los valores (.values()) en lugar de las claves (.keys())
const allowedExtensions = Array.from(ALLOWED_FILE_TYPES.values()).join("|");
const filePathRegex = new RegExp(
  `^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${allowedExtensions})$`,
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

    const { title, artist, duration, path } = body;

    if (!title || !artist || duration === undefined || !path) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    if (typeof title !== "string" || typeof artist !== "string") {
      return NextResponse.json(
        { error: "El título y el artista deben ser cadenas de texto" },
        { status: 400 },
      );
    }

    if (title.trim().length === 0 || artist.trim().length === 0) {
      return NextResponse.json(
        { error: "El título y el artista no pueden estar vacíos" },
        { status: 400 },
      );
    }

    if (title.trim().length < 1 || title.trim().length > 50) {
      return NextResponse.json(
        { error: "El título debe tener entre 1 y 50 caracteres" },
        { status: 400 },
      );
    }

    if (artist.trim().length < 1 || artist.trim().length > 50) {
      return NextResponse.json(
        { error: "El artista debe tener entre 1 y 50 caracteres" },
        { status: 400 },
      );
    }

    if (typeof duration !== "number" || !Number.isFinite(duration)) {
      return NextResponse.json(
        { error: "La duración debe ser un número válido" },
        { status: 400 },
      );
    }

    if (duration <= 0 || duration >= MAX_DURATION_SECONDS) {
      return NextResponse.json(
        {
          error: `La duración debe ser mayor que 0 y menor a ${MAX_DURATION_SECONDS} segundos`,
        },
        { status: 400 },
      );
    }

    if (typeof path !== "string" || !filePathRegex.test(path)) {
      return NextResponse.json(
        { error: "La ruta del archivo no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: existingTrack, error: existingTrackError } =
      await supabase.storage.from(BUCKET_NAME).exists(path);

    if (existingTrackError) {
      console.error(
        "Error al verificar la existencia del archivo:",
        existingTrackError,
      );
      return NextResponse.json(
        { error: "Error al verificar la existencia del archivo" },
        { status: 500 },
      );
    }

    if (!existingTrack) {
      return NextResponse.json(
        { error: "El archivo no existe en el almacenamiento" },
        { status: 400 },
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    const { data: newTrack, error: dbError } = await supabase
      .from("tracks")
      .insert({
        title: title.trim(),
        artist: artist.trim(),
        duration,
        path,
        url: publicUrl,
      })
      .select()
      .single();

    if (dbError) {
       const {error: storageRemoveError} =await supabase.storage
       .from(BUCKET_NAME)
       .remove([path]);

       if(storageRemoveError){
        console.error("Fallo al intentar limpiar el archivo huérfano:", storageRemoveError)
       }
       if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe un registro con este archivo o ruta." },
          { status: 409 },
        );
      }
      
      if (dbError.code === "23514") {
        return NextResponse.json(
          { error: "Los datos proporcionados violan las restricciones de la base de datos." },
          { status: 400 },
        );
      }

      console.error("Error de base de datos no mapeado:", dbError);
      return NextResponse.json(
        { error: "Ocurrió un error al guardar el registro en la base de datos" },
        { status: 500 },
      );
    }

    return NextResponse.json({ track: newTrack }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error inesperado en POST /api/admin/tracks:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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

    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "El ID del track es requerido y debe ser un texto válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: trackToDel, error: findError } = await supabase
      .from("tracks")
      .select("id, path")
      .eq("id", id)
      .single();

    if (findError || !trackToDel) {
      return NextResponse.json(
        { error: "No se encontró el track especificado" },
        { status: 404 },
      );
    }

  
    const { error: dbError } = await supabase
      .from("tracks")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Error al eliminar el registro de la base de datos:", dbError);
      return NextResponse.json(
        { error: "Ocurrió un error al eliminar el registro" },
        { status: 500 },
      );
    }

    if (trackToDel.path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([trackToDel.path]);

      if (storageError) {
        console.error("Error al borrar el archivo físico del bucket:", storageError);
      }
    }

    return NextResponse.json(
      { message: "Track eliminado correctamente", id },
      { status: 200 },
    );

  } catch (error: unknown) {
    console.error("Error inesperado en DELETE /api/admin/tracks:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}