create table public.tracks(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  duration numeric not null,
  url text not null,
  path text unique not null,
  created_at timestamptz not null default now(),

  constraint tracks_title_lenght
  check (char_length(title) >0 and char_length(title) <=50),

  constraint tracks_artist_lenght
  check (char_length(artist) >0 and char_length(artist) <=50),

  constraint tracks_duration_lenght
  check (duration > 0 and duration <36000)
)
RLS:
create policy "Allow public select"}
on "public"."tracks"
as PERMISSIVE
for SELECT
to public
using (
  true
);
