create table public.comments (
  id uuid primary key default gen_random_uuid(),

  visitor_uid uuid not null,
  story_id uuid not null,

  message text not null,
  created_at timestamptz not null default now(),

  constraint comments_message_length
    check (char_length(message) > 0 and char_length(message) <= 200),

  constraint comments_visitor_uid_fkey
    foreign key (visitor_uid)
    references public.visitors(uid)
    on delete cascade,

  constraint comments_story_id_fkey
    foreign key (story_id)
    references public.stories(id)
    on delete cascade
);