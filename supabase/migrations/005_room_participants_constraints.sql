-- 005: room_participants に UNIQUE 制約と RLS を追加
--      003 で作成済みのテーブルへの差分マイグレーション

-- UNIQUE(room_id, participant_id) — upsertに必要
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'room_participants'::regclass
      AND contype = 'u'
      AND conname = 'room_participants_room_id_participant_id_key'
  ) THEN
    ALTER TABLE room_participants
    ADD CONSTRAINT room_participants_room_id_participant_id_key
    UNIQUE (room_id, participant_id);
  END IF;
END
$$;

-- RLS
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "room_participants_select" ON room_participants
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "room_participants_insert" ON room_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "room_participants_delete" ON room_participants
  FOR DELETE USING (true);
