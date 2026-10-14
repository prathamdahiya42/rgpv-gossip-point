-- ============================================================
-- RGPV GOSSIP POINT — Row-Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable RLS on all 8 tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.match_queue enable row level security;
alter table public.matches enable row level security;
alter table public.match_messages enable row level security;

-- ============================================================
-- 1. PROFILES
-- ============================================================
drop policy if exists "Anyone can read handles" on public.profiles;
create policy "Anyone can read handles"
on public.profiles for select
to public
using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert
to authenticated, anon
with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
to authenticated, anon
using (auth.uid() = id);

-- ============================================================
-- 2. POSTS
-- ============================================================
drop policy if exists "Public reads non-hidden posts" on public.posts;
create policy "Public reads non-hidden posts"
on public.posts for select
to public
using (is_hidden = false or auth.uid() = author_id);

drop policy if exists "Active users create posts" on public.posts;
create policy "Active users create posts"
on public.posts for insert
to authenticated, anon
with check (
  auth.uid() = author_id
  and not exists (
    select 1 from public.profiles where id = auth.uid() and is_banned = true
  )
);

drop policy if exists "Authors update own posts" on public.posts;
create policy "Authors update own posts"
on public.posts for update
to authenticated, anon
using (auth.uid() = author_id);

-- ============================================================
-- 3. COMMENTS
-- ============================================================
drop policy if exists "Public reads non-hidden comments" on public.comments;
create policy "Public reads non-hidden comments"
on public.comments for select
to public
using (is_hidden = false or auth.uid() = author_id);

drop policy if exists "Active users create comments" on public.comments;
create policy "Active users create comments"
on public.comments for insert
to authenticated, anon
with check (
  auth.uid() = author_id
  and not exists (
    select 1 from public.profiles where id = auth.uid() and is_banned = true
  )
);

-- ============================================================
-- 4. REACTIONS
-- ============================================================
drop policy if exists "Public reads reactions" on public.reactions;
create policy "Public reads reactions"
on public.reactions for select
to public
using (true);

drop policy if exists "Active users insert reactions" on public.reactions;
create policy "Active users insert reactions"
on public.reactions for insert
to authenticated, anon
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.profiles where id = auth.uid() and is_banned = true
  )
);

drop policy if exists "Users update own reactions" on public.reactions;
create policy "Users update own reactions"
on public.reactions for update
to authenticated, anon
using (auth.uid() = user_id);

drop policy if exists "Users delete own reactions" on public.reactions;
create policy "Users delete own reactions"
on public.reactions for delete
to authenticated, anon
using (auth.uid() = user_id);

-- ============================================================
-- 5. REPORTS
-- ============================================================
drop policy if exists "Users insert reports" on public.reports;
create policy "Users insert reports"
on public.reports for insert
to authenticated, anon
with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
on public.reports for select
to authenticated, anon
using (auth.uid() = reporter_id);

-- ============================================================
-- 6. MATCH QUEUE
-- ============================================================
drop policy if exists "Users manage own queue status" on public.match_queue;
create policy "Users manage own queue status"
on public.match_queue for all
to authenticated, anon
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================
-- 7. MATCHES
-- ============================================================
drop policy if exists "Participants read matches" on public.matches;
create policy "Participants read matches"
on public.matches for select
to authenticated, anon
using (auth.uid() in (user_a, user_b));

drop policy if exists "Participants update matches" on public.matches;
create policy "Participants update matches"
on public.matches for update
to authenticated, anon
using (auth.uid() in (user_a, user_b));

-- ============================================================
-- 8. MATCH MESSAGES
-- ============================================================
drop policy if exists "Participants read match messages" on public.match_messages;
create policy "Participants read match messages"
on public.match_messages for select
to authenticated, anon
using (
  exists (
    select 1 from public.matches m
    where m.id = match_messages.match_id
      and auth.uid() in (m.user_a, m.user_b)
  )
);

drop policy if exists "Participants insert match messages during active chat" on public.match_messages;
create policy "Participants insert match messages during active chat"
on public.match_messages for insert
to authenticated, anon
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.matches m
    where m.id = match_messages.match_id
      and auth.uid() in (m.user_a, m.user_b)
      and m.ends_at > now()
      and m.left_at is null
  )
);
