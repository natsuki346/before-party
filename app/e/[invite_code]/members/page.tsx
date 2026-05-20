import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, ParticipantWithProfile } from "@/lib/supabase/types";
import MembersList from "./MembersList";

async function getEventWithParticipants(invite_code: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: event } = await supabase
    .from("events")
    .select()
    .eq("invite_code", invite_code)
    .single();

  if (!event) return null;

  const { data: participants } = await supabase
    .from("participants")
    .select("*, profiles(*)")
    .eq("event_id", event.id)
    .order("created_at");

  return { event, participants: (participants ?? []) as ParticipantWithProfile[] };
}

export const revalidate = 30;

export default async function MembersPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = await params;
  const result = await getEventWithParticipants(invite_code);

  if (!result) {
    return (
      <main
        className="flex items-center justify-center bg-white"
        style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
      >
        <p className="text-sm text-gray-400">参加者情報を取得できませんでした</p>
      </main>
    );
  }

  return (
    <MembersList
      event={result.event}
      participants={result.participants}
      inviteCode={invite_code}
    />
  );
}
