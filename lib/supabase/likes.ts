import { createClient } from "./client";

/** LIKEを送る。UNIQUE制約違反（すでにLIKE済み）は正常系として無視する。 */
export async function sendLike(
  eventId: string,
  fromParticipantId: string,
  toParticipantId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("likes").insert({
    event_id: eventId,
    from_participant_id: fromParticipantId,
    to_participant_id: toParticipantId,
  });
  // 23505 = UNIQUE constraint violation (already liked) → treat as success
  if (error && error.code !== "23505") {
    throw error;
  }
}

/** toParticipantId が fromParticipantId に既にLIKEを送っているか確認する */
export async function checkMutualLike(
  eventId: string,
  fromParticipantId: string,
  toParticipantId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("event_id", eventId)
    .eq("from_participant_id", toParticipantId)
    .eq("to_participant_id", fromParticipantId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** 自分のつながり（相互LIKE済み）の相手participant_idリストを返す */
export async function getConnections(
  eventId: string,
  participantId: string
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("likes")
    .select("from_participant_id, to_participant_id")
    .eq("event_id", eventId)
    .or(
      `from_participant_id.eq.${participantId},to_participant_id.eq.${participantId}`
    );
  if (error || !data) return [];

  const sent = new Set(
    data
      .filter((l) => l.from_participant_id === participantId)
      .map((l) => l.to_participant_id)
  );
  const received = new Set(
    data
      .filter((l) => l.to_participant_id === participantId)
      .map((l) => l.from_participant_id)
  );

  return [...sent].filter((id) => received.has(id));
}

/** つながり数を返す */
export async function getConnectionCount(
  participantId: string,
  eventId: string
): Promise<number> {
  try {
    const list = await getConnections(eventId, participantId);
    return list.length;
  } catch {
    return 0;
  }
}
