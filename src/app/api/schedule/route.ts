import {
  BroadcastCurrent,
  BroadcastNext,
  BroadcastTrack,
  BroadcastState,
} from "@/services/audioService/types";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CurrentSlotRow {
  id: string;
  playlist_id: string;
  starts_at: string;
  ends_at: string;
  playlists: { title: string };
}

interface NextSlotRow {
  starts_at: string;
  playlists: { title: string };
}

interface TrackRow {
  tracks: BroadcastTrack;
}

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    const { data: currentData, error: currentError } = await supabase
      .from("schedule_slots")
      .select("id, playlist_id, starts_at, ends_at, playlists(title)")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .maybeSingle();

    if (currentError) {
      console.error("Error al consultar el horario actual:", currentError);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar la programación" },
        { status: 500 },
      );
    }

    let current: BroadcastCurrent | null = null;

    if (currentData) {
      const slot = currentData as unknown as CurrentSlotRow;

      const { data: trackData, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select("tracks(title, artist, duration, url)")
        .eq("playlist_id", slot.playlist_id)
        .order("position");

      if (tracksError) {
        console.error(
          "Error al consultar las canciones del horario:",
          tracksError,
        );
        return NextResponse.json(
          { error: "Ocurrió un error al consultar la programación" },
          { status: 500 },
        );
      }

      const trackRows = (trackData ?? []) as unknown as TrackRow[];

      current = {
        slot_id: slot.id,
        playlist_title: slot.playlists.title,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        tracks: trackRows.map((row) => row.tracks),
      };
    }
    const { data: nextData, error: nextError } = await supabase
      .from("schedule_slots")
      .select("starts_at, playlists(title)")
      .gt("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) {
      console.error("Error al consultar el siguiente horario:", nextError);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar la programación" },
        { status: 500 },
      );
    }//

    let next: BroadcastNext | null = null;

    if (nextData) {
      const slot = nextData as unknown as NextSlotRow;

      next = {
        playlist_title: slot.playlists.title,
        starts_at: slot.starts_at,
      };
    }

    const state: BroadcastState = { serverTime: now, current, next };

    return NextResponse.json(state);
  } catch (error: unknown) {
    console.error("Error inesperado en GET api/schedule:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
