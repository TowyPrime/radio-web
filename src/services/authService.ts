import {createClient}from '../utils/supabase/client';

export class AuthService{
    private static supabase = createClient();
    //Lógica para iniciar sesión con Google
    static async signInWithGoogle(redirectTo?: string) {
        const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
    }

    //Lógica para iniciar sesión con correo electrónico y contraseña
    static async signInWithEmail(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            throw new Error(error.message)
        }

        return data
    }

    //Lógica para cerrar sesión
    static async signOut() {
        const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
      }

      //Lógica para obtener el usuario actual
      static async getCurrentUser() {
        const { data: { user }, error } = await this.supabase.auth.getUser()
        if (error) {
          throw new Error(error.message)
        }
        return user
      }

      //Lógica para que el usuario cambie su contraseña
      static async changePassword(newPassword: string) {
        const { data, error } = await this.supabase.auth.updateUser({
            password: newPassword
        })
        if (error) {
            throw new Error(error.message)
        }
        return data
    }

      //crea un nuevo usuario con correo electrónico y contraseña
      static async signUpWithEmail(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
              // El enlace del correo de confirmación vuelve a la app y abre la sesión
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
          throw new Error(error.message)
        }
        return data
      }

      //Elimina la cuenta del usuario actual (perfil + usuario de Auth). Se hace en el servidor
      //porque borrar un usuario de Auth requiere la service role key.
      static async deleteAccount() {
        const response = await fetch('/api/account/delete', { method: 'DELETE' })
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.error || 'No se pudo eliminar la cuenta')
        }
        await this.supabase.auth.signOut()
      }

}