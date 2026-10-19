import { createServiceRoleClient } from "@/utils/supabase/service";
import { Slot,ScheduleSlotRow} from "./types";





export async function getUpcomingSlots(): Promise<Slot[]> {
    const supabase = createServiceRoleClient();

    const ahora = new Date().toISOString();

    const {data, error} = await supabase
    .from('schedule_slots')
    .select('id, playlist_id, starts_at, ends_at, playlists(title)')
    .gte('ends_at', ahora)
    .order('starts_at', {ascending: true})

    if(error){
        console.error("Error al obtener los proximos horarios:", error)
        throw new Error(error.message)
    }
    
    const rows = (data ?? []) as unknown as ScheduleSlotRow[];

   const slots = rows.map((row) => ({
      id: row.id,
      playlist_id: row.playlist_id,
      playlist_title: row.playlists.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
    }));

    return slots;
}


