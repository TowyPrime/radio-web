export interface Slot {
  id: string;
  playlist_id: string;
  playlist_title: string;
  starts_at: string;
  ends_at: string;
}
export interface ScheduleSlotRow {
  id: string;
  playlist_id: string;
  starts_at: string;
  ends_at: string;
  playlists: { title: string };
}