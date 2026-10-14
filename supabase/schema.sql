-- ============================================================
-- RGPV GOSSIP POINT — Clean 8-Table Schema
-- Streamlined anonymous campus app for UIT RGPV Bhopal
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (Anonymous Handle & Status)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  is_banned boolean not null default false,
  blind_date_banned_until timestamptz,
  handle_changed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. POSTS (Crushes, Gossip, Campus, Garba)
-- ============================================================
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('crushes', 'gossip', 'campus', 'garba')),
  body text not null check (char_length(body) >= 10 and char_length(body) <= 500),
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Ensure garba is accepted even if posts table existed previously
alter table public.posts drop constraint if exists posts_section_check;
alter table public.posts add constraint posts_section_check check (section in ('crushes', 'gossip', 'campus', 'garba'));

-- ============================================================
-- 3. COMMENTS
-- ============================================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 300),
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. REACTIONS (One reaction per user per post: 🔥, 😂, 💀)
-- ============================================================
create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😂', '💀')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ============================================================
-- 5. REPORTS (Auto-hide trigger source)
-- ============================================================
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message', 'user')),
  target_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- ============================================================
-- 6. MATCH QUEUE (5-minute Blind Date waiting pool)
-- ============================================================
create table if not exists public.match_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'cancelled')),
  mode text not null default 'general' check (mode in ('general', 'garba')),
  created_at timestamptz not null default now()
);
alter table public.match_queue add column if not exists mode text not null default 'general';

-- ============================================================
-- 7. MATCHES (Active Blind Dates)
-- ============================================================
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  mode text not null default 'general' check (mode in ('general', 'garba')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '5 minutes'),
  left_at timestamptz,
  left_by uuid references public.profiles(id)
);
alter table public.matches add column if not exists mode text not null default 'general';

-- ============================================================
-- 8. MATCH MESSAGES (Real-time 3-minute chat messages)
-- ============================================================
create table if not exists public.match_messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 300),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_posts_section_created on public.posts(section, created_at desc);
create index if not exists idx_comments_post_created on public.comments(post_id, created_at asc);
create index if not exists idx_match_messages_match_created on public.match_messages(match_id, created_at asc);
create index if not exists idx_match_queue_status_created on public.match_queue(status, created_at desc);
create index if not exists idx_matches_participants on public.matches(user_a, user_b);
create index if not exists idx_reports_target on public.reports(target_type, target_id);

-- ============================================================
-- PUBLIC-SAFE VIEWS (Never exposes author_id)
-- ============================================================
create or replace view public.posts_view as
select
  p.id,
  p.section,
  p.body,
  p.is_hidden,
  p.report_count,
  p.created_at,
  pr.handle
from public.posts p
join public.profiles pr on p.author_id = pr.id
where p.is_hidden = false;

create or replace view public.comments_view as
select
  c.id,
  c.post_id,
  c.body,
  c.is_hidden,
  c.report_count,
  c.created_at,
  pr.handle
from public.comments c
join public.profiles pr on c.author_id = pr.id
where c.is_hidden = false;

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================
-- Enable publication for realtime matches and chat messages
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'matches') then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'match_messages') then
    alter publication supabase_realtime add table public.match_messages;
  end if;
end $$;
