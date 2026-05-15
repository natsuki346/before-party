create extension if not exists "pgcrypto";

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  invite_code text unique not null
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references participants(id) on delete cascade,
  life_stage text,
  work_context text,
  worries text[],
  values text[]
);

-- invite_code の高速検索用
create index on events (invite_code);
create index on participants (event_id);
