import { createClient } from '@/utils/supabase/server';

export interface TrackRecord{
    id: string | number;
  title: string;
  artist: string;
  url: string;
  created_at?: string;
}

//Obtener canciones desde tanla tracks de Supabase
export async function getTracks(): Promise<TrackRecord[]> {
  // El cliente se crea dentro de la función: depende de las cookies de la petición actual,
  // por lo que no puede crearse a nivel de módulo.
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener tracks:', error.message);
    throw new Error(error.message);
  }

  return data || [];
}

//Agregar canciones
export async function createTrack(newTrack: Omit<TrackRecord, 'id'>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tracks')
    .insert([newTrack])
    .select()
    .single();

  if (error) {
    console.error('Error al crear track:', error.message);
    throw new Error(error.message);
  }

  return data;
}
