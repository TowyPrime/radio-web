create table schedule_slots(
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint schedule_slots_playlist_id_fkey
  foreign key (playlist_id)
  references public.playlists(id)
  on delete cascade,

  constraint schedule_slots_start_end_comparation
  check(starts_at < ends_at),
  
  constraint schedule_slots_no_overlap
  exclude using gist(
    tstzrange(starts_at, ends_at, '[)') with &&
  )

);

alter table schedule_slots enable row level security;