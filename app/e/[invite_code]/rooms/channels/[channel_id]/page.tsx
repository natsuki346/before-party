import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, Room, RoomMessage } from "@/lib/supabase/types";
import ChatRoom from "./ChatRoom";

const DUMMY_ROOMS: Record<string, string> = {
  "r-childcare":    "子育て中",
  "r-entrepreneur": "起業家",
  "r-freelance":    "フリーランス",
  "r-employee":     "会社員",
  "r-student":      "学生",
  "r-career":       "キャリア相談",
  "r-money":        "お金の話",
  "r-relations":    "人間関係",
  "r-skills":       "スキルアップ",
  "r-engineer":     "エンジニア",
  "r-designer":     "デザイナー",
  "r-sales":        "営業",
  "r-marketer":     "マーケター",
  "r-20s":          "20代",
  "r-30s":          "30代",
  "r-40plus":       "40代以上",
};

const DUMMY_MESSAGES: Record<string, RoomMessage[]> = {
  "r-childcare": [
    { id: "dc-1", room_id: "r-childcare", sender_name: "山田 美咲", content: "子育てしながら仕事するの本当に大変ですよね😅", created_at: "2026-05-15T10:00:00Z" },
    { id: "dc-2", room_id: "r-childcare", sender_name: "佐藤 花子", content: "わかります！保育園の送り迎えと会議が重なることも多くて", created_at: "2026-05-15T10:02:00Z" },
    { id: "dc-3", room_id: "r-childcare", sender_name: "山田 美咲", content: "テレワークになってから少し楽になりました", created_at: "2026-05-15T10:04:00Z" },
  ],
  "r-entrepreneur": [
    { id: "de-1", room_id: "r-entrepreneur", sender_name: "鈴木 一郎", content: "資金調達の話し相手を探してます。みなさんどのフェーズですか？", created_at: "2026-05-15T09:30:00Z" },
    { id: "de-2", room_id: "r-entrepreneur", sender_name: "田中 太郎", content: "シードです！エンジニア採用に苦戦中", created_at: "2026-05-15T09:32:00Z" },
    { id: "de-3", room_id: "r-entrepreneur", sender_name: "鈴木 一郎", content: "採用、うちも大変でした。副業からジョインしてもらうのがよかったです", created_at: "2026-05-15T09:35:00Z" },
  ],
  "r-career": [
    { id: "dca-1", room_id: "r-career", sender_name: "山田 美咲", content: "転職活動中なんですが、ポートフォリオって作るべきですか？", created_at: "2026-05-15T11:00:00Z" },
    { id: "dca-2", room_id: "r-career", sender_name: "田中 太郎", content: "職種によりますが、あった方が絶対いいですよ", created_at: "2026-05-15T11:03:00Z" },
    { id: "dca-3", room_id: "r-career", sender_name: "鈴木 一郎", content: "GitHubのREADMEを丁寧に書くだけでも違います", created_at: "2026-05-15T11:05:00Z" },
  ],
  "r-money": [
    { id: "dm-1", room_id: "r-money", sender_name: "佐藤 花子", content: "フリーランスになってから収入が不安定で、投資を始めました", created_at: "2026-05-15T13:00:00Z" },
    { id: "dm-2", room_id: "r-money", sender_name: "田中 太郎", content: "インデックス投資ですか？積立NISAはやってます", created_at: "2026-05-15T13:05:00Z" },
  ],
  "r-engineer": [
    { id: "den-1", room_id: "r-engineer", sender_name: "田中 太郎", content: "最近Rustを触ってるんですが難しすぎる笑", created_at: "2026-05-15T14:00:00Z" },
    { id: "den-2", room_id: "r-engineer", sender_name: "鈴木 一郎", content: "わかる！型システムに慣れると楽しくなってきますよ", created_at: "2026-05-15T14:03:00Z" },
    { id: "den-3", room_id: "r-engineer", sender_name: "田中 太郎", content: "まずはToo-Doアプリから作ってみます", created_at: "2026-05-15T14:05:00Z" },
  ],
  "r-30s": [
    { id: "d30-1", room_id: "r-30s", sender_name: "佐藤 花子", content: "30代って人生の転換点ですよね。仕事も家族も考えること多い", created_at: "2026-05-15T15:00:00Z" },
    { id: "d30-2", room_id: "r-30s", sender_name: "鈴木 一郎", content: "ほんとそれ。優先順位をちゃんと決めないとパンクします", created_at: "2026-05-15T15:05:00Z" },
  ],
};

async function getData(channel_id: string) {
  // Known dummy room
  if (DUMMY_ROOMS[channel_id]) {
    const room: Room = {
      id: channel_id,
      event_id: "dummy-event-id",
      name: DUMMY_ROOMS[channel_id],
      created_at: "",
    };
    return { room, messages: DUMMY_MESSAGES[channel_id] ?? [], isDummy: true };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: room } = await supabase
      .from("rooms")
      .select()
      .eq("id", channel_id)
      .single();

    if (!room) {
      // Locally created room in demo mode — empty chat
      const fallback: Room = { id: channel_id, event_id: "", name: "ルーム", created_at: "" };
      return { room: fallback, messages: [], isDummy: true };
    }

    const { data: messages } = await supabase
      .from("room_messages")
      .select()
      .eq("room_id", channel_id)
      .order("created_at");

    return { room, messages: (messages ?? []) as RoomMessage[], isDummy: false };
  } catch {
    const fallback: Room = { id: channel_id, event_id: "", name: "ルーム", created_at: "" };
    return { room: fallback, messages: [], isDummy: true };
  }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ invite_code: string; channel_id: string }>;
}) {
  const { invite_code, channel_id } = await params;
  const { room, messages, isDummy } = await getData(channel_id);

  return (
    <ChatRoom
      room={room}
      initialMessages={messages}
      inviteCode={invite_code}
      isDummy={isDummy}
    />
  );
}
