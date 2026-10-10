import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { UUID_REGEX, MAX_TRACKS_PER_PLAYLIST } from "@/lib/tracks/constants";
import { PlaylistTrackRow, PlaylistTrack } from "@/services/audioService/types";

export async function POST(
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

    const { id: playlistId } = await params;

    if (typeof playlistId !== "string" || !UUID_REGEX.test(playlistId)) {
      return NextResponse.json(
        { error: "El id de la playlist no tiene un formato válido" },
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

    const { track_id } = body;

    if (typeof track_id !== "string" || !UUID_REGEX.test(track_id)) {
      return NextResponse.json(
        { error: "La id de la canción no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { count, error: countError } = await supabase
      .from("playlist_tracks")
      .select("*", { count: "exact", head: true })
      .eq("playlist_id", playlistId);

    if (countError) {
      console.error("Error al contar las canciones:", countError);
      return NextResponse.json(
        { error: "Ocurrió un error al verificar el límite de la playlist" },
        { status: 500 },
      );
    }

    if (count !== null && count >= MAX_TRACKS_PER_PLAYLIST) {
      return NextResponse.json(
        {
          error: `La playlist ha alcanzado el límite máximo de ${MAX_TRACKS_PER_PLAYLIST} canciones`,
        },
        { status: 422 },
      );
    }

    const { data: maxPosData, error: maxPosError } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxPosError) {
      console.error("Error al calcular la posición:", maxPosError);
      return NextResponse.json(
        { error: "Ocurrió un error al calcular la posición de la canción" },
        { status: 500 },
      );
    }

    const nextPosition = maxPosData ? maxPosData.position + 1 : 1;

    const { data, error } = await supabase
      .from("playlist_tracks")
      .insert({
        playlist_id: playlistId,
        track_id,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Distinguir si falló por duplicado de canción o por colisión de posición
        if (
          error.message.includes(
            "restriction_in_playlist_table_playlist_id_track_id",
          ) ||
          error.details?.includes("track_id")
        ) {
          return NextResponse.json(
            {
              error:
                "La canción que se intenta añadir ya existe dentro de la playlist",
            },
            { status: 409 },
          );
        }
        return NextResponse.json(
          {
            error:
              "Conflicto en la posición de la canción dentro de la playlist",
          },
          { status: 409 },
        );
      }

      if (error.code === "23503") {
        return NextResponse.json(
          {
            error:
              "Alguna de las IDs proporcionadas no existe o está mal escrita.",
          },
          { status: 404 },
        );
      }

      if (error.code === "23514") {
        return NextResponse.json(
          {
            error:
              "Los datos proporcionados violan las restricciones de la base de datos.",
          },
          { status: 400 },
        );
      }

      console.error("Error inesperado de la base de datos:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al intentar añadir música a la playlist" },
        { status: 500 },
      );
    }

    return NextResponse.json({ track: data }, { status: 201 });
  } catch (error: unknown) {
    console.error(
      "Error inesperado en POST api/admin/playlists/[id]/tracks:",
      error,
    );

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

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

    const { id: playlistId } = await params;

    if (typeof playlistId !== "string" || !UUID_REGEX.test(playlistId)) {
      return NextResponse.json(
        { error: "El id de la playlist no tiene un formato válido" },
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

    const { track_ids } = body;

    if (!Array.isArray(track_ids)) {
      return NextResponse.json(
        { error: "La propiedad track_ids es requerida y debe ser un arreglo" },
        { status: 400 },
      );
    }

    if (track_ids.length > MAX_TRACKS_PER_PLAYLIST) {
      return NextResponse.json(
        {
          error:
            "La longitud máxima de la lista de canciones fue alcanzada, no se pueden agregar más",
        },
        { status: 400 },
      );
    }

    const uniqueTracks = new Set(track_ids);

    if (uniqueTracks.size !== track_ids.length) {
      return NextResponse.json(
        { error: "la lista de canciones contiene duplicados" },
        { status: 400 },
      );
    }

    for (const trackId of track_ids) {
      if (typeof trackId !== "string" || !UUID_REGEX.test(trackId)) {
        return NextResponse.json(
          { error: "El id de la canción no tiene un formato válido" },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceRoleClient();

    const { data: currentTracks, error } = await supabase
      .from("playlist_tracks")
      .select("track_id")
      .eq("playlist_id", playlistId);

    if (error) {
      console.error("Error al intentar obtener ids de tracks:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al intentar traer los ids de tracks." },
        { status: 500 },
      );
    }

    if (currentTracks.length !== track_ids.length) {
      return NextResponse.json(
        {
          error:
            "La lista de ids proporcionada tiene una diferente longitud a la original",
        },
        { status: 400 },
      );
    }

    const requestedTracks = new Set(track_ids);

    const currentTracksIds = new Set(
      currentTracks.map((track) => track.track_id),
    );

    const sameIds =
      requestedTracks.size === currentTracksIds.size &&
      [...requestedTracks].every((trackId) => currentTracksIds.has(trackId));

    if (!sameIds) {
      return NextResponse.json(
        {
          error:
            "Los ids de canciones proporcionados no coinciden con los ids actuales de la playlist",
        },
        { status: 400 },
      );
    }

    const rows = track_ids.map((trackId: string, index: number) => ({
      playlist_id: playlistId,
      track_id: trackId,
      position: index + 1,
    }));

    const { error: updateError } = await supabase
      .from("playlist_tracks")
      .upsert(rows, {
        onConflict: "playlist_id,track_id",
      });

    if (updateError) {
      console.error("Error al reordenar posición de canciones:", updateError);
      return NextResponse.json(
        { error: "Ocurrió un error al actualizar el orden de las canciones" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "El orden de la canciones fue actualizado correctamente" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "Error inesperado en DELETE api/admin/playlists/[id]/tracks/[track_id]",
      error,
    );

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

export async function GET(
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

    const resolveParams = await params;
    const playlistId = resolveParams.id;

    if (typeof playlistId !== "string" || !UUID_REGEX.test(playlistId)) {
      return NextResponse.json(
        { error: "El id de la playlist no tiene un formato válido" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: playlistExist, error: playlistError } = await supabase
      .from("playlists")
      .select()
      .eq("id", playlistId)
      .single();

    if (playlistError || !playlistExist) {
      return NextResponse.json(
        { error: "Playlist no encontrada" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("playlist_tracks")
      .select("position, track_id, tracks(title, artist, duration, url)")
      .eq("playlist_id", playlistId)
      .order("position");

    if (error) {
      console.error(
        "Ocurrió un error al intentar traer las canciones en la playlist:",
        error,
      );
      return NextResponse.json(
        { error: "Ocurrió un error al consultar las canciones de la playlist" },
        { status: 500 },
      );
    }

    const rawRows = (data ?? []) as unknown as PlaylistTrackRow[];

    const tracks: PlaylistTrack[] = rawRows.map((item) => ({
      position: item.position,
      track_id: item.track_id,
      title: item.tracks?.title ?? "",
      artist: item.tracks?.artist ?? "",
      duration: item.tracks?.duration ?? 0,
      url: item.tracks?.url ?? "",
    }));

    return NextResponse.json({ tracks: tracks });
  } catch (error: unknown) {
    console.error("Error inesperado en GET/api/admin/playlist/[id]:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
