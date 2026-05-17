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

// Flat list of all members with roomName merged in
const allMembers = DUMMY_ROOM_MEMBERS.flatMap((r) =>
  r.members.map((m) => ({
    ...m,
    roomName: r.roomName,
    allTags: [r.roomName, ...m.tags],
  }))
);

// All unique tags from roomNames + member tags
const allTags = Array.from(
  new Set(DUMMY_ROOM_MEMBERS.flatMap((r) => r.members.flatMap((m) => [r.roomName, ...m.tags])))
);

export default function MembersPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredMembers = allMembers.filter(
    (m) =>
      selectedTags.length === 0 ||
      selectedTags.some((t) => m.allTags.includes(t))
  );

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
        <span className="text-xs text-gray-400">{filteredMembers.length}人</span>
      </div>

      {/* Filter area */}
      <div className="shrink-0 border-b border-gray-100">
        {/* Filter label + clear */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-xs font-semibold text-gray-500">
            フィルタ
            {selectedTags.length > 0 && (
              <span className="ml-1.5 text-gray-900">{selectedTags.length}個選択中</span>
            )}
          </span>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-gray-400 active:opacity-60 transition-opacity"
            >
              クリア
            </button>
          )}
        </div>
        {/* Scrollable tag buttons */}
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flat member list */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-12">
            該当するメンバーがいません
          </p>
        ) : (
          filteredMembers.map((member, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                {member.name[0]}
              </div>
              {/* Name + tags */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{member.name}</p>
                <div className="flex flex-wrap gap-1">
                  {member.allTags.map((tag) => {
                    const highlighted = selectedTags.includes(tag);
                    return (
                      <span
                        key={tag}
                        className={`text-[11px] rounded-full px-2 py-0.5 ${
                          highlighted
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
