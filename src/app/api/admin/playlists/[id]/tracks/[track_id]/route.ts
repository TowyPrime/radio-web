import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { UUID_REGEX } from "@/lib/tracks/constants";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; track_id: string }> },
) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const resolvedParams = await params;
    const playlistId = resolvedParams.id;
    const trackId = resolvedParams.track_id;

    if (typeof playlistId !== "string" || !UUID_REGEX.test(playlistId)) {
      return NextResponse.json(
        { error: "El id de la playlist no tiene un formato válido" },
        { status: 400 },
      );
    }

    if (typeof trackId !== "string" || !UUID_REGEX.test(trackId)) {
      return NextResponse.json(
        { error: "El id de la canción no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();


    const { data: trackToDel, error: trackError } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId)
      .select("*")
      .maybeSingle(); 

    if (trackError) {
      console.error("Error al buscar canción antes de eliminarla:", trackError);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar la canción" },
        { status: 500 },
      );
    }

  
    if (!trackToDel) {
      return NextResponse.json(
        { error: "No se encontró la canción especificada en la playlist" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Canción eliminada correctamente" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "Error inesperado en DELETE /api/admin/playlists/[id]/tracks/[track_id]:",
      error,
    );

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
