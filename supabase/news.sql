create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  category text not null,
  body text not null,
  cover_path text,
  cover_url text,
  author_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,

  constraint news_title_length check (char_length(title) between 1 and 120),
  constraint news_summary_length check (char_length(summary) between 1 and 300),
  constraint news_category_length check (char_length(category) between 1 and 30),
  constraint news_body_length check (char_length(body) between 1 and 100000),
  constraint news_author_name_length check (char_length(author_name) between 1 and 60),
  constraint news_cover_consistency check ((cover_path is null) = (cover_url is null))
);

alter table public.news enable row level security;

create policy "Allow public select"
on public.news
as permissive
for select
to public
using (true);

create index news_created_at_idx on public.news (created_at desc);