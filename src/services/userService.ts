import { createClient } from '@/utils/supabase/client';

export interface UserProfile {
  uid: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  rol: string;
  isFirstLogin: boolean;
  created_at?: string;
}

const supabase = createClient();

export const userService = {
  //Obtiene el perfil del usuario por su UID. Retorna null si no se encuentra.
  async getByUid(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw new Error(`Error al obtener el usuario: ${error.message}`);
    }

    return data;
  },

  // Crea un nuevo perfil de usuario. Si no se especifica el rol, se asigna 'user' por defecto.
  async createProfile(profile: Omit<UserProfile, 'rol' | 'created_at'> & { rol?: string }): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          uid: profile.uid,
          username: profile.username,
          full_name: profile.full_name,
          isFirstLogin: profile.isFirstLogin || false,
          avatar_url: profile.avatar_url || null,
          rol: profile.rol || 'user',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al registrar el perfil: ${error.message}`);
    }

    return data;
  },
// Actualiza el perfil del usuario.
  async updateProfile(uid: string, updates: Partial<Omit<UserProfile, 'uid' | 'created_at'>>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('uid', uid)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el perfil: ${error.message}`);
    }

    return data;
  },

  async isAdmin(uid: string): Promise<boolean> {
    const profile = await this.getByUid(uid);
    return profile?.rol === 'admin';
  }
};