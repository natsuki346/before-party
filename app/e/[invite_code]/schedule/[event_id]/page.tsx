import Link from "next/link";
import { ArrowLeft, MapPin, User, Users } from "lucide-react";
import { notFound } from "next/navigation";

type EventItem = {
  title: string;
  date: string;
  time: string;
  participants: number;
  location: string;
  description: string;
  organizer: string;
  tags: string[];
};

// event_id = event.date ("2026-06-01" etc.)
const DUMMY_EVENTS: EventItem[] = [
  {
    title: "テストイベント",
    date: "2026-06-01",
    time: "18:00",
    participants: 12,
    location: "渋谷ヒカリエ 8F",
    description:
      "エンジニア・デザイナー・起業家が集まる交流イベント。参加前にプロフィールを見て、話したい人を見つけよう。初めての方も大歓迎です。",
    organizer: "なつき",
    tags: ["#エンジニア", "#交流会", "#スタートアップ"],
  },
  {
    title: "AI勉強会",
    date: "2026-06-15",
    time: "19:00",
    participants: 8,
    location: "渋谷ヒカリエ 8F",
    description:
      "最新のAIトレンドや実践事例を共有する勉強会。LTや議論を通じてAI活用のヒントを持ち帰ろう。",
    organizer: "なつき",
    tags: ["#AI", "#勉強会", "#エンジニア"],
  },
  {
    title: "起業家LT会",
    date: "2026-07-01",
    time: "18:30",
    participants: 20,
    location: "渋谷ヒカリエ 8F",
    description:
      "起業家・スタートアップ関係者によるライトニングトーク。事業の課題・学び・失敗談をシェアし合う場です。",
    organizer: "なつき",
    tags: ["#起業家", "#LT", "#スタートアップ"],
  },
];

const AVATAR_COLORS = ["#4A90D9", "#7B61FF", "#E05C5C", "#F59E0B", "#34D399"];
const AVATAR_INITIALS = ["田", "佐", "鈴", "山", "中"];

function ParticipantIcons({ count }: { count: number }) {
  const shown = Math.min(count, 5);
  const extra = count - shown;
  return (
    <div className="flex items-center">
      {Array.from({ length: shown }, (_, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
          style={{
            backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            marginLeft: i > 0 ? "-8px" : 0,
          }}
        >
          {AVATAR_INITIALS[i]}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-semibold border-2 border-white"
          style={{ marginLeft: "-8px" }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ invite_code: string; event_id: string }>;
}) {
  const { invite_code, event_id } = await params;
  const event = DUMMY_EVENTS.find((e) => e.date === event_id);
  if (!event) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = new Date(event.date + "T00:00:00") < today;

  const dateLabel = new Date(event.date + "T00:00:00").toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <main
      className="flex flex-col bg-white overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center px-3 border-b border-gray-100">
        <Link
          href={`/e/${invite_code}/schedule`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors flex items-center gap-1 text-sm text-gray-600"
        >
          <ArrowLeft size={18} />
          <span>戻る</span>
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        {/* Past badge */}
        {isPast && (
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full self-start">
            終了
          </span>
        )}

        {/* Title */}
        <h1 className={`text-2xl font-bold leading-tight ${isPast ? "text-gray-400" : "text-gray-900"}`}>
          {event.title}
        </h1>

        {/* Date / time / location */}
        <div className="flex flex-col gap-1.5">
          <p className={`text-sm ${isPast ? "text-gray-400" : "text-gray-700"}`}>
            {dateLabel}　{event.time}〜
          </p>
          <div className={`flex items-center gap-1.5 text-sm ${isPast ? "text-gray-300" : "text-gray-500"}`}>
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Description */}
        <p className={`text-sm leading-relaxed ${isPast ? "text-gray-400" : "text-gray-700"}`}>
          {event.description}
        </p>

        {/* Participants */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            参加者
          </p>
          <div className="flex items-center justify-between">
            <ParticipantIcons count={event.participants} />
            <div className={`flex items-center gap-1 text-sm ${isPast ? "text-gray-300" : "text-gray-500"}`}>
              <Users size={13} />
              <span>{event.participants}人参加</span>
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <User size={15} className="text-gray-400" />
          </div>
          <span className={`text-sm ${isPast ? "text-gray-400" : "text-gray-600"}`}>
            主催：{event.organizer}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-3 py-1.5 rounded-full ${
                isPast ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-gray-600"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Space for fixed button */}
        <div className="h-4" />
      </div>

      {/* Fixed bottom button */}
      <div className="shrink-0 px-5 py-3 border-t border-gray-100 bg-white">
        <Link
          href={`/e/${invite_code}/rooms`}
          className={`block w-full text-center text-sm font-semibold py-3.5 rounded-2xl transition-opacity active:opacity-80 ${
            isPast ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white"
          }`}
        >
          ルームに入る
        </Link>
      </div>
    </main>
  );
}
