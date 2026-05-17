"use client";

import { useState } from "react";
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

const FILTER_TABS = ["すべて", "属性", "職種", "価値観"] as const;
type FilterTab = typeof FILTER_TABS[number];

export default function MembersPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [activeFilter, setActiveFilter] = useState<FilterTab>("すべて");

  const totalMembers = DUMMY_ROOM_MEMBERS.reduce((sum, r) => sum + r.members.length, 0);

  const visibleRooms = activeFilter === "すべて"
    ? DUMMY_ROOM_MEMBERS
    : DUMMY_ROOM_MEMBERS.filter((r) => r.category === activeFilter);

  return (
    <main
      className="flex flex-col bg-white overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/rooms/channels`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900 flex-1">参加者一覧</h1>
        <span className="text-xs text-gray-400">{totalMembers}人</span>
      </div>

      {/* Filter tabs */}
      <div
        className="shrink-0 flex gap-2 px-4 py-3 border-b border-gray-100"
        style={{ overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Room sections */}
      <div className="flex-1 overflow-y-auto">
        {visibleRooms.map((roomGroup) => (
          <div key={roomGroup.roomName}>
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">#{roomGroup.roomName}</span>
              <span className="text-xs text-gray-400">（{roomGroup.members.length}人）</span>
            </div>
            {/* Members */}
            {roomGroup.members.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                  {member.name[0]}
                </div>
                {/* Name + tags */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{member.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {member.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
