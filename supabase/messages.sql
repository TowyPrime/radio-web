create table public.messages (
  id uuid primary key default gen_random_uuid(),

  visitor_uid uuid not null,

  message text not null,

  created_at timestamptz not null default now(),

  constraint messages_message_length
    check (char_length(message) > 0 and char_length(message) <= 100),

  constraint messages_visitor_uid_fkey
    foreign key (visitor_uid)
    references public.visitors(uid)
    on delete cascade

);