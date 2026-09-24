import { createClient } from "@supabase/supabase-js"

export const VISITOR_COOKIE_NAME = 'visitor_token'

export function createServiceRoleClient(){
    const supabaseUrl =  process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    

    if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan las variables de entorno para el cliente de Service Role.')
  }

    return createClient(supabaseUrl, serviceRoleKey,{
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}