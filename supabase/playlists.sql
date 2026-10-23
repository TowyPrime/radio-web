
create table public.playlists(
uid uuid  primary key default gen_random_uuid(),
user_uid uuid not null,
title text not null,
created_at timestamptz not null default now(),

 constraint playlist_user_uid_fkey
    foreign key (user_uid)
    references public.profiles(uid)
    on delete cascade,

constraint playlist_title_lenght
check(char_length(title) >0 and char_length(title) <=50)
);

RLS
create policy "Enable users to view their own data only"

on "public"."playlist"

as PERMISSIVE

for SELECT

to authenticated

using (
  (select auth.uid()) = user_id
);