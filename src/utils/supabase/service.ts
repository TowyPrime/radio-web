import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

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

export async function getCurrentVisitor() {
  const cookieStore = await cookies();
  const visitorToken = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (!visitorToken) return null;

  const serviceSupabase = createServiceRoleClient();

  const { data, error } = await serviceSupabase
    .from('visitors')
    .select('uid, username')
    .eq('token', visitorToken)
    .single();

    if(error?.code === 'PGRST116'){
        return null;
    }

  if (error){
    throw error;
  }

  return {
    visitorUid: data.uid,
    username: data.username,
  };
}