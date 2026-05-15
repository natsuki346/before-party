-- =====================================================
-- before-party セットアップSQL
-- Supabase SQL Editor にそのまま貼り付けて実行してください
-- =====================================================

-- events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  invite_code text unique not null
);

-- participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  name text not null,
  created_at timestamptz default now()
);

-- profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id),
  life_stage text,
  work_context text,
  worries text[],
  values text[]
);

-- match_requests
create table if not exists match_requests (
  id uuid primary key default gen_random_uuid(),
  from_participant_id uuid references participants(id),
  to_participant_id uuid references participants(id),
  status text default 'pending',
  created_at timestamptz default now()
);

-- messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references match_requests(id),
  sender_id uuid references participants(id),
  content text not null,
  created_at timestamptz default now()
);

-- インデックス
create index if not exists events_invite_code_idx on events (invite_code);
create index if not exists participants_event_id_idx on participants (event_id);
create index if not exists match_requests_from_idx on match_requests (from_participant_id);
create index if not exists match_requests_to_idx on match_requests (to_participant_id);
create index if not exists messages_match_id_idx on messages (match_id);

-- Realtime有効化
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table match_requests;
