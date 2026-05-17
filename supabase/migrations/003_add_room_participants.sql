create table if not exists room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid references participants(id) on delete set null,
  display_name text not null,
  joined_at timestamptz default now()
);

create index if not exists room_participants_room_id_idx on room_participants (room_id);
