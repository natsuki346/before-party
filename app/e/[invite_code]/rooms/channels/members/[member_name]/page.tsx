"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const DUMMY_ROOM_MEMBERS = [
  {
    roomName: "エンジニア",
    category: "職種",
    members: [
      { name: "田中 太郎", tags: ["フロントエンド", "成長", "挑戦"] },
      { name: "佐藤 花子", tags: ["バックエンド", "効率"] },
      { name: "鈴木 一郎", tags: ["AI・ML", "挑戦", "成長"] },
    ],
  },
  {
    roomName: "起業家",
    category: "属性",
    members: [
      { name: "山田 美咲", tags: ["経営者", "貢献", "つながり"] },
      { name: "伊藤 健",   tags: ["スタートアップ", "挑戦"] },
    ],
  },
  {
    roomName: "フリーランス",
    category: "属性",
    members: [
      { name: "木村 さくら", tags: ["UIデザイン", "自由", "創造"] },
      { name: "中村 翔",     tags: ["マーケター", "効率"] },
    ],
  },
  {
    roomName: "キャリア相談",
    category: "価値観",
    members: [
      { name: "小林 葵", tags: ["社会人（会社員）", "キャリア", "成長"] },
      { name: "加藤 蓮", tags: ["転職活動中", "スキルアップ"] },
    ],
  },
];

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

export default function MemberDetailPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");
  const rawName = Array.isArray(params.member_name)
    ? params.member_name[0]
    : (params.member_name ?? "");
  const memberName = decodeURIComponent(rawName);

  // Find member in flat list
  let found: { name: string; tags: string[]; roomName: string } | null = null;
  for (const room of DUMMY_ROOM_MEMBERS) {
    const m = room.members.find((m) => m.name === memberName);
    if (m) {
      found = { ...m, roomName: room.roomName };
      break;
    }
  }

  // Stable gradient based on name character code sum
  const gradientIdx = memberName
    ? memberName.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % COVER_GRADIENTS.length
    : 0;
  const coverGradient = COVER_GRADIENTS[gradientIdx];

  return (
    <main
      className="flex flex-col bg-white overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/rooms/channels/members`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">プロフィール</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {!found ? (
          <p className="text-center text-sm text-gray-400 mt-12">
            メンバーが見つかりません
          </p>
        ) : (
          <>
            {/* Cover */}
            <div style={{ height: "100px", background: coverGradient, flexShrink: 0 }} />

            {/* Avatar */}
            <div className="px-4">
              <div
                className="w-[72px] h-[72px] rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white -mt-9"
              >
                {found.name[0]}
              </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pt-3 pb-8 flex flex-col gap-5">
              {/* Name */}
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{found.name}</h2>

              <div className="border-t border-gray-100" />

              {/* Room */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  ルーム
                </p>
                <div>
                  <span className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-700">
                    #{found.roomName}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {found.tags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    タグ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {found.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Connect button */}
              <button className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-gray-900 text-white active:opacity-80 transition-opacity mt-2">
                つながる
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
