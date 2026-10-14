import { createServiceRoleClient } from "@/utils/supabase/service";

export async function isPlaylistOnAir(playlistId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from("schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("playlist_id", playlistId)
    .lte("starts_at", now)
    .gt("ends_at", now);

  if (error) throw error;

  return (count ?? 0) > 0;
}

export async function isTrackOnAir(trackId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data: rows, error } = await supabase
    .from("playlist_tracks")
    .select("playlist_id")
    .eq("track_id", trackId);

  if (error) throw error;

  const playlistIds = (rows ?? []).map((row) => row.playlist_id);

  if (playlistIds.length === 0) return false;

  const now = new Date().toISOString();

  const { count, error: slotError } = await supabase
    .from("schedule_slots")
    .select("id", { count: "exact", head: true })
    .in("playlist_id", playlistIds)
    .lte("starts_at", now)
    .gt("ends_at", now);

  if (slotError) throw slotError;

  return (count ?? 0) > 0;
}