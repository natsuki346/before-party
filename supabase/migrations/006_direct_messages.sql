CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  to_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  -- Stable conversation key: sorted UUIDs joined by '|'
  -- Enables simple Realtime filter without OR logic
  conversation_id TEXT GENERATED ALWAYS AS (
    CASE
      WHEN from_participant_id::text < to_participant_id::text
      THEN from_participant_id::text || '|' || to_participant_id::text
      ELSE to_participant_id::text || '|' || from_participant_id::text
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS direct_messages_conversation_id_idx
  ON direct_messages (conversation_id, created_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "読み取り自由" ON direct_messages FOR SELECT USING (true);
CREATE POLICY "挿入自由" ON direct_messages FOR INSERT WITH CHECK (true);
