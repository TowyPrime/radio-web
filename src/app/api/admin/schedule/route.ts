import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { UUID_REGEX } from "@/lib/tracks/constants";
import {
  MAX_SLOT_HOURS,
  MARGIN_MS,
  parseLocalDateTime,
} from "@/lib/schedule/constants";
import { ScheduleSlotRow } from "@/lib/schedule/types";

interface PlaylistDurationRow {
  tracks: { duration: number };
}



function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  return `${minutes} min ${seconds} s`;
}

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

    const { playlist_id, starts_at, ends_at } = body;

    if (typeof playlist_id !== "string" || !UUID_REGEX.test(playlist_id)) {
      return NextResponse.json(
        { error: "El id de la playlist no tiene un formato válido" },
        { status: 400 },
      );
    }

    if (typeof starts_at !== "string" || typeof ends_at !== "string") {
      return NextResponse.json(
        { error: "Las fechas de inicio y fin deben ser texto" },
        { status: 400 },
      );
    }

    const startDate = parseLocalDateTime(starts_at);
    const endDate = parseLocalDateTime(ends_at);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Las fechas deben tener el formato AAAA-MM-DDTHH:mm" },
        { status: 400 },
      );
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la de inicio" },
        { status: 400 },
      );
    }

    if (startDate.getTime() < Date.now() - MARGIN_MS) {
      return NextResponse.json(
        { error: "No se puede programar un horario en el pasado" },
        { status: 400 },
      );
    }

    const windowSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    const maxWindowSeconds = MAX_SLOT_HOURS * 3600;

    if (windowSeconds > maxWindowSeconds) {
      return NextResponse.json(
        { error: `Un horario no puede durar más de ${MAX_SLOT_HOURS} horas` },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", playlist_id)
      .maybeSingle();

    if (playlistError) {
      console.error("Error al buscar la playlist:", playlistError);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar la playlist" },
        { status: 500 },
      );
    }

    if (!playlist) {
      return NextResponse.json(
        { error: "No se encontró la playlist especificada" },
        { status: 404 },
      );
    }

    const { data: rows, error: rowsError } = await supabase
      .from("playlist_tracks")
      .select("tracks(duration)")
      .eq("playlist_id", playlist_id);

    if (rowsError) {
      console.error("Error al calcular la duración de la playlist:", rowsError);
      return NextResponse.json(
        { error: "Ocurrió un error al calcular la duración de la playlist" },
        { status: 500 },
      );
    }

    const trackRows = (rows ?? []) as unknown as PlaylistDurationRow[];

    if (trackRows.length === 0) {
      return NextResponse.json(
        { error: "La playlist no tiene canciones, no se puede programar" },
        { status: 422 },
      );
    }

    const playlistSeconds = trackRows.reduce(
      (total, row) => total + row.tracks.duration,
      0,
    );

    if (playlistSeconds > windowSeconds) {
      return NextResponse.json(
        {
          error: `La playlist dura ${formatDuration(playlistSeconds)} y el horario es de ${formatDuration(windowSeconds)}. Sobran ${formatDuration(playlistSeconds - windowSeconds)}.`,
        },
        { status: 422 },
      );
    }

    const { data, error } = await supabase
      .from("schedule_slots")
      .insert({
        playlist_id,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23P01") {
        return NextResponse.json(
          { error: "El horario se traslapa con otro ya programado" },
          { status: 409 },
        );
      }

      if (error.code === "23503") {
        return NextResponse.json(
          { error: "No se encontró la playlist especificada" },
          { status: 404 },
        );
      }

      if (error.code === "23514") {
        return NextResponse.json(
          {
            error:
              "Los datos proporcionados violan las restricciones de la base de datos",
          },
          { status: 400 },
        );
      }

      console.error("Error al crear el horario:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al crear el horario" },
        { status: 500 },
      );
    }

    return NextResponse.json({ slot: data }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error inesperado en POST api/admin/schedule:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("schedule_slots")
      .select("id, playlist_id, starts_at, ends_at, playlists(title)")
      .gte("ends_at", new Date().toISOString())// sólo trae lo vidente
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("Error al consultar los horarios:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar los horarios" },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as unknown as ScheduleSlotRow[];

    const slots = rows.map((row) => ({
      id: row.id,
      playlist_id: row.playlist_id,
      playlist_title: row.playlists.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
    }));

    return NextResponse.json({ slots });
  } catch (error: unknown) {
    console.error("Error inesperado en GET api/admin/schedule:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}


