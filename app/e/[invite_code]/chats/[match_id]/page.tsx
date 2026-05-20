import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatRoom from "./ChatRoom";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ invite_code: string; match_id: string }>;
}) {
  const { invite_code, match_id } = await params;

  const supabase = await createClient();
  const { data: other } = await supabase
    .from("participants")
    .select("id, name")
    .eq("id", match_id)
    .single();

  if (!other) notFound();

  return (
    <ChatRoom
      otherParticipantId={other.id}
      otherParticipantName={other.name}
      inviteCode={invite_code}
    />
  );
}
