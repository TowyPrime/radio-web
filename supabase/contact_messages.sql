-- Mensajes del formulario de contacto (se ejecuta una vez en el SQL Editor de Supabase).
--
-- La tabla queda CERRADA: con RLS activado y sin ninguna política, ni el navegador ni los
-- usuarios anónimos pueden leerla ni escribirla. Solo la API del servidor, con la llave
-- service_role (que ignora RLS), guarda, lee, marca y borra los mensajes.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 120),
  message text not null check (char_length(message) between 10 and 2000),
  -- Resumen irreversible (HMAC) de la IP del remitente: sirve para limitar el spam sin guardar la IP
  ip_hash text not null,
  created_at timestamptz not null default now(),
  -- Vacío = sin leer
  read_at timestamptz
);

alter table public.contact_messages enable row level security;

-- Cinturón y tirantes: además de RLS, se quitan los permisos de los roles públicos
revoke all on public.contact_messages from anon, authenticated;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_ip_hash_created_at_idx
  on public.contact_messages (ip_hash, created_at desc);

-- Comprobación: debe devolver rowsecurity = true y 0 políticas
-- select c.relrowsecurity as rowsecurity,
--        (select count(*) from pg_policies p where p.tablename = 'contact_messages') as politicas
-- from pg_class c where c.oid = 'public.contact_messages'::regclass;
