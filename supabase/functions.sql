-- ============================================================
-- RGPV GOSSIP POINT — Database Triggers & RPCs
-- ============================================================

-- ============================================================
-- 1. REPORT TRIGGER (Auto-hide on 3 reports, 24h ban for users)
-- ============================================================
create or replace function public.handle_report_submission()
returns trigger
language plpgsql
security definer
as $$
declare
  v_unique_count integer;
  v_target_user_id uuid;
begin
  -- 1. If target is a post
  if new.target_type = 'post' then
    select count(distinct reporter_id) into v_unique_count
    from public.reports
    where target_type = 'post' and target_id = new.target_id;

    update public.posts
    set report_count = v_unique_count,
        is_hidden = case when v_unique_count >= 3 then true else is_hidden end
    where id = new.target_id;

  -- 2. If target is a comment
  elsif new.target_type = 'comment' then
    select count(distinct reporter_id) into v_unique_count
    from public.reports
    where target_type = 'comment' and target_id = new.target_id;

    update public.comments
    set report_count = v_unique_count,
        is_hidden = case when v_unique_count >= 3 then true else is_hidden end
    where id = new.target_id;

  -- 3. If target is a user (or reported from chat message)
  elsif new.target_type in ('user', 'message') then
    if new.target_type = 'message' then
      select sender_id into v_target_user_id
      from public.match_messages
      where id = new.target_id;
    else
      v_target_user_id := new.target_id;
    end if;

    if v_target_user_id is not null then
      select count(distinct reporter_id) into v_unique_count
      from public.reports
      where (target_type = 'user' and target_id = v_target_user_id)
         or (target_type = 'message' and target_id in (
            select id from public.match_messages where sender_id = v_target_user_id
         ))
        and created_at >= (now() - interval '24 hours');

      if v_unique_count >= 3 then
        update public.profiles
        set blind_date_banned_until = now() + interval '24 hours'
        where id = v_target_user_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_report_inserted on public.reports;
create trigger on_report_inserted
after insert on public.reports
for each row
execute function public.handle_report_submission();

-- ============================================================
-- 2. BLIND DATE: ENFORCE MESSAGE CUTOFF (Database-enforced 3-minute limit)
-- ============================================================
create or replace function public.enforce_match_message_time()
returns trigger
language plpgsql
security definer
as $$
declare
  v_ends_at timestamptz;
  v_left_at timestamptz;
begin
  select ends_at, left_at into v_ends_at, v_left_at
  from public.matches
  where id = new.match_id;

  if v_ends_at is null then
    raise exception 'Match does not exist.';
  end if;

  if v_left_at is not null then
    raise exception 'Chat has ended; partner left early.';
  end if;

  if v_ends_at <= now() then
    raise exception 'Time is up; no messages allowed after 5 minutes.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_match_message_inserted on public.match_messages;
create trigger on_match_message_inserted
before insert on public.match_messages
for each row
execute function public.enforce_match_message_time();

-- ============================================================
-- 3. BLIND DATE MATCHER: RPC join_blind_date()
-- Automated Postgres Matcher (No AI/LLM cost, FOR UPDATE SKIP LOCKED)
-- ============================================================
create or replace function public.join_blind_date(p_mode text default 'general', p_vibe text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_profile record;
  v_existing_match_id uuid;
  v_partner_id uuid;
  v_partner_vibe text;
  v_new_match_id uuid;
  v_ends_at timestamptz;
begin
  if v_current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Verify user is not banned
  select is_banned, blind_date_banned_until into v_profile
  from public.profiles
  where id = v_current_user_id;

  if v_profile.is_banned then
    raise exception 'Your account is banned.';
  end if;

  if v_profile.blind_date_banned_until is not null and v_profile.blind_date_banned_until > now() then
    raise exception 'You are temporarily suspended from Blind Date due to reports.';
  end if;

  -- 1. Check if user is already in an active, non-expired match
  select id, ends_at into v_existing_match_id, v_ends_at
  from public.matches
  where (user_a = v_current_user_id or user_b = v_current_user_id)
    and ends_at > now()
    and left_at is null
  order by started_at desc
  limit 1;

  if v_existing_match_id is not null then
    delete from public.match_queue where user_id = v_current_user_id;
    return jsonb_build_object(
      'status', 'matched',
      'match_id', v_existing_match_id,
      'ends_at', v_ends_at
    );
  end if;

  -- 2. Clean up stale queue entries (> 45s old)
  delete from public.match_queue
  where created_at < (now() - interval '45 seconds');

  -- 3. Look for another waiting user
  -- If p_mode = 'music' and p_vibe is provided, try exact vibe match first
  if p_mode = 'music' and p_vibe is not null then
    select q.user_id, q.vibe into v_partner_id, v_partner_vibe
    from public.match_queue q
    where q.status = 'waiting'
      and q.mode = 'music'
      and q.vibe = p_vibe
      and q.user_id <> v_current_user_id
      and q.created_at >= (now() - interval '45 seconds')
      and not exists (
        select 1 from public.matches m
        where ((m.user_a = v_current_user_id and m.user_b = q.user_id)
            or (m.user_b = v_current_user_id and m.user_a = q.user_id))
          and m.started_at >= (now() - interval '10 minutes')
      )
    order by q.created_at asc
    for update skip locked
    limit 1;
  end if;

  -- Fallback: any waiting user in the same mode
  if v_partner_id is null then
    select q.user_id, q.vibe into v_partner_id, v_partner_vibe
    from public.match_queue q
    where q.status = 'waiting'
      and q.mode = p_mode
      and q.user_id <> v_current_user_id
      and q.created_at >= (now() - interval '45 seconds')
      and not exists (
        select 1 from public.matches m
        where ((m.user_a = v_current_user_id and m.user_b = q.user_id)
            or (m.user_b = v_current_user_id and m.user_a = q.user_id))
          and m.started_at >= (now() - interval '10 minutes')
      )
    order by q.created_at asc
    for update skip locked
    limit 1;
  end if;

  -- 4. If partner found, create match!
  if v_partner_id is not null then
    v_ends_at := now() + interval '5 minutes';

    insert into public.matches (user_a, user_b, mode, vibe, started_at, ends_at)
    values (v_current_user_id, v_partner_id, p_mode, coalesce(p_vibe, v_partner_vibe), now(), v_ends_at)
    returning id into v_new_match_id;

    -- Remove both from queue
    delete from public.match_queue
    where user_id in (v_current_user_id, v_partner_id);

    return jsonb_build_object(
      'status', 'matched',
      'match_id', v_new_match_id,
      'ends_at', v_ends_at
    );
  end if;

  -- 5. Otherwise, upsert waiting status in queue with selected mode and vibe
  insert into public.match_queue (user_id, status, mode, vibe, created_at)
  values (v_current_user_id, 'waiting', p_mode, p_vibe, now())
  on conflict (user_id)
  do update set status = 'waiting', mode = p_mode, vibe = p_vibe, created_at = now();

  return jsonb_build_object(
    'status', 'waiting',
    'match_id', null,
    'ends_at', null
  );
end;
$$;

-- ============================================================
-- 4. CANCEL MATCH QUEUE: RPC cancel_blind_date()
-- ============================================================
create or replace function public.cancel_blind_date()
returns boolean
language plpgsql
security definer
as $$
begin
  delete from public.match_queue
  where user_id = auth.uid();
  return true;
end;
$$;

-- ============================================================
-- 5. LEAVE MATCH: RPC leave_blind_date()
-- ============================================================
create or replace function public.leave_blind_date(p_match_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.matches
  set left_at = now(),
      left_by = auth.uid()
  where id = p_match_id
    and (user_a = auth.uid() or user_b = auth.uid())
    and left_at is null;

  delete from public.match_queue
  where user_id = auth.uid();

  return true;
end;
$$;


-- ============================================================
-- 6. TOPIC FEEDS: RPC get_feed_posts()
-- Computed Hot ranking in SQL: (reactions*2 + comments*3) / (age_in_hours + 2)^1.3
-- ============================================================
create or replace function public.get_feed_posts(
  p_section text,
  p_sort text default 'new',
  p_cursor timestamptz default null,
  p_limit int default 20
)
returns table (
  id uuid,
  section text,
  body text,
  created_at timestamptz,
  handle text,
  fire_count bigint,
  laugh_count bigint,
  skull_count bigint,
  comment_count bigint
)
language plpgsql
security definer
as $$
begin
  if p_sort = 'hot' then
    return query
    select
      p.id,
      p.section,
      p.body,
      p.created_at,
      pr.handle,
      count(distinct case when r.emoji = '🔥' then r.user_id end) as fire_count,
      count(distinct case when r.emoji = '😂' then r.user_id end) as laugh_count,
      count(distinct case when r.emoji = '💀' then r.user_id end) as skull_count,
      count(distinct c.id) as comment_count
    from public.posts p
    join public.profiles pr on p.author_id = pr.id
    left join public.reactions r on r.post_id = p.id
    left join public.comments c on c.post_id = p.id and c.is_hidden = false
    where p.section = p_section
      and p.is_hidden = false
      and (p_cursor is null or p.created_at < p_cursor)
    group by p.id, pr.handle
    order by
      ((count(distinct r.user_id)*2 + count(distinct c.id)*3) + 1.0) /
      power((extract(epoch from (now() - p.created_at)) / 3600.0 + 2.0), 1.3) desc,
      p.created_at desc
    limit p_limit;
  else
    return query
    select
      p.id,
      p.section,
      p.body,
      p.created_at,
      pr.handle,
      count(distinct case when r.emoji = '🔥' then r.user_id end) as fire_count,
      count(distinct case when r.emoji = '😂' then r.user_id end) as laugh_count,
      count(distinct case when r.emoji = '💀' then r.user_id end) as skull_count,
      count(distinct c.id) as comment_count
    from public.posts p
    join public.profiles pr on p.author_id = pr.id
    left join public.reactions r on r.post_id = p.id
    left join public.comments c on c.post_id = p.id and c.is_hidden = false
    where p.section = p_section
      and p.is_hidden = false
      and (p_cursor is null or p.created_at < p_cursor)
    group by p.id, pr.handle
    order by p.created_at desc
    limit p_limit;
  end if;
end;
$$;
