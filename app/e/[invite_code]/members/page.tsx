import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, Event, ParticipantWithProfile } from "@/lib/supabase/types";
import MembersList from "./MembersList";

const DUMMY_EVENT: Event = {
  id: "dummy-event-id",
  title: "テストイベント",
  description: null,
  event_date: "2026-06-01T18:00:00+09:00",
  invite_code: "test-event",
};

const DUMMY_PARTICIPANTS: ParticipantWithProfile[] = [
  {
    id: "1",
    event_id: "dummy-event-id",
    name: "田中 太郎",
    created_at: "2026-05-01T00:00:00Z",
    profiles: {
      id: "prof-1",
      participant_id: "1",
      life_stage: "社会人",
      work_context: "スタートアップでエンジニア",
      worries: ["キャリア", "スキルアップ"],
      values: ["成長", "挑戦"],
    },
  },
  {
    id: "2",
    event_id: "dummy-event-id",
    name: "佐藤 花子",
    created_at: "2026-05-02T00:00:00Z",
    profiles: {
      id: "prof-2",
      participant_id: "2",
      life_stage: "フリーランス",
      work_context: "UIデザイナー",
      worries: ["収入の安定", "時間管理"],
      values: ["自由", "創造"],
    },
  },
  {
    id: "3",
    event_id: "dummy-event-id",
    name: "鈴木 一郎",
    created_at: "2026-05-03T00:00:00Z",
    profiles: {
      id: "prof-3",
      participant_id: "3",
      life_stage: "起業家",
      work_context: "SaaSプロダクト開発中",
      worries: ["資金調達", "採用"],
      values: ["挑戦", "貢献"],
    },
  },
  {
    id: "4",
    event_id: "dummy-event-id",
    name: "山田 美咲",
    created_at: "2026-05-04T00:00:00Z",
    profiles: {
      id: "prof-4",
      participant_id: "4",
      life_stage: "転職活動中",
      work_context: "元マーケター",
      worries: ["次のキャリア", "人間関係"],
      values: ["安定", "成長"],
    },
  },
];

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

  if (!event) {
    return { event: DUMMY_EVENT, participants: DUMMY_PARTICIPANTS };
  }

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

  return (
    <MembersList
      event={result.event}
      participants={result.participants}
      inviteCode={invite_code}
    />
  );
}
