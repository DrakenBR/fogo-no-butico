-- ============================================================
-- FOGO NO BUTICO — Supabase schema (Postgres)
-- Rodar no SQL Editor do Supabase. Idempotente.
-- ============================================================

-- Extensões
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type looking_for_t as enum ('marido', 'amante', 'zoeira');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type_t as enum ('photo', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reaction_type_t as enum ('fire');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABELAS
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  bio          text default '',
  age          int  check (age is null or (age >= 18 and age <= 120)),
  city         text default '',
  looking_for  looking_for_t not null default 'zoeira',
  avatar_url   text,
  verified     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_city_idx     on public.profiles (city);

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  media_url  text not null,
  media_type media_type_t not null,
  caption    text default '',
  created_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx   on public.posts (user_id);
create index if not exists posts_created_idx   on public.posts (created_at desc);

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       reaction_type_t not null default 'fire',
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists reactions_post_idx on public.reactions (post_id);
create index if not exists reactions_user_idx on public.reactions (user_id);
create index if not exists reactions_created_idx on public.reactions (created_at desc);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  media_url  text not null,
  media_type media_type_t not null,
  caption    text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists stories_user_idx    on public.stories (user_id);
create index if not exists stories_expires_idx on public.stories (expires_at);

-- ============================================================
-- VIEWS
-- ============================================================

-- Contagem de 🔥 por post
create or replace view public.post_stats as
select
  p.id as post_id,
  p.user_id,
  count(r.id)::int as fires,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comments
from public.posts p
left join public.reactions r on r.post_id = p.id
group by p.id, p.user_id;

-- Ranking "Mais Quente da Semana" (últimos 7 dias)
create or replace view public.weekly_ranking as
select
  pr.id            as user_id,
  pr.username,
  pr.display_name,
  pr.city,
  pr.avatar_url,
  count(r.id)::int as fires,
  rank() over (order by count(r.id) desc) as position
from public.profiles pr
left join public.posts p
       on p.user_id = pr.id
left join public.reactions r
       on r.post_id = p.id
      and r.created_at >= now() - interval '7 days'
group by pr.id, pr.username, pr.display_name, pr.city, pr.avatar_url
order by fires desc;

-- Stories ativos (não expirados)
create or replace view public.active_stories as
select s.*, pr.username, pr.display_name, pr.avatar_url
from public.stories s
join public.profiles pr on pr.id = s.user_id
where s.expires_at > now();

-- ============================================================
-- TRIGGER: cria profile automaticamente quando user nasce no auth
-- (com username placeholder; onboarding sobrescreve)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text := coalesce(
    nullif(split_part(new.email, '@', 1), ''),
    'butico'
  );
  candidate text := base_username;
  i int := 0;
begin
  -- garantir unicidade do username placeholder
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name, looking_for)
  values (new.id, candidate, candidate, 'zoeira')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.reactions enable row level security;
alter table public.comments  enable row level security;
alter table public.stories   enable row level security;

-- PROFILES: leitura pública, escrita só do dono
drop policy if exists "profiles read all"   on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;

create policy "profiles read all"   on public.profiles for select using (true);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles delete own" on public.profiles for delete using (auth.uid() = id);

-- POSTS
drop policy if exists "posts read all"   on public.posts;
drop policy if exists "posts insert own" on public.posts;
drop policy if exists "posts update own" on public.posts;
drop policy if exists "posts delete own" on public.posts;

create policy "posts read all"   on public.posts for select using (true);
create policy "posts insert own" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts update own" on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts delete own" on public.posts for delete using (auth.uid() = user_id);

-- REACTIONS
drop policy if exists "reactions read all"   on public.reactions;
drop policy if exists "reactions insert own" on public.reactions;
drop policy if exists "reactions delete own" on public.reactions;

create policy "reactions read all"   on public.reactions for select using (true);
create policy "reactions insert own" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions delete own" on public.reactions for delete using (auth.uid() = user_id);

-- COMMENTS
drop policy if exists "comments read all"   on public.comments;
drop policy if exists "comments insert own" on public.comments;
drop policy if exists "comments update own" on public.comments;
drop policy if exists "comments delete own" on public.comments;

create policy "comments read all"   on public.comments for select using (true);
create policy "comments insert own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments update own" on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments delete own" on public.comments for delete using (auth.uid() = user_id);

-- STORIES
drop policy if exists "stories read active"  on public.stories;
drop policy if exists "stories insert own"   on public.stories;
drop policy if exists "stories delete own"   on public.stories;

create policy "stories read active"  on public.stories for select using (expires_at > now() or auth.uid() = user_id);
create policy "stories insert own"   on public.stories for insert with check (auth.uid() = user_id);
create policy "stories delete own"   on public.stories for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies de storage: leitura pública, upload só de usuário autenticado
-- e cada arquivo deve viver embaixo do próprio uid (1º segmento do path).
drop policy if exists "media read public"  on storage.objects;
drop policy if exists "media insert own"   on storage.objects;
drop policy if exists "media update own"   on storage.objects;
drop policy if exists "media delete own"   on storage.objects;
drop policy if exists "avatars read public" on storage.objects;
drop policy if exists "avatars upsert own"  on storage.objects;
drop policy if exists "avatars delete own"  on storage.objects;

create policy "media read public" on storage.objects
  for select using (bucket_id in ('media', 'avatars'));

create policy "media insert own" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media update own" on storage.objects
  for update using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media delete own" on storage.objects
  for delete using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars upsert own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars update own" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars delete own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
