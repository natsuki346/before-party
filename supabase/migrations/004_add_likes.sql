-- likesテーブル
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  to_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, from_participant_id, to_participant_id)
);

CREATE INDEX IF NOT EXISTS likes_from_idx ON likes (event_id, from_participant_id);
CREATE INDEX IF NOT EXISTS likes_to_idx ON likes (event_id, to_participant_id);

-- connectionsビュー（相互LIKEしたペアを返す・重複排除済み）
CREATE OR REPLACE VIEW connections AS
SELECT
  l1.event_id,
  l1.from_participant_id AS participant_a_id,
  l1.to_participant_id   AS participant_b_id,
  GREATEST(l1.created_at, l2.created_at) AS connected_at
FROM likes l1
INNER JOIN likes l2
  ON  l1.event_id            = l2.event_id
  AND l1.from_participant_id = l2.to_participant_id
  AND l1.to_participant_id   = l2.from_participant_id
WHERE l1.from_participant_id < l1.to_participant_id;

-- RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "誰でもlikeを読める" ON likes FOR SELECT USING (true);
CREATE POLICY "自分のlikeを作れる" ON likes FOR INSERT WITH CHECK (true);
