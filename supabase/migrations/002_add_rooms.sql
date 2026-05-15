-- rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- room_messages (sender_name を直接保持してシンプルに)
create table if not exists room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  sender_name text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists rooms_event_id_idx on rooms (event_id);
create index if not exists room_messages_room_id_idx on room_messages (room_id, created_at);

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_messages;
