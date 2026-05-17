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

const FILTER_CATEGORIES: Record<string, string[]> = {
  属性: ["学生", "社会人（会社員）", "フリーランス", "起業家", "その他"],
  職種: ["エンジニア", "デザイナー", "マーケター", "営業", "経営者", "研究・教育", "医療・福祉", "その他"],
  価値観: ["自由", "安定", "成長", "貢献", "挑戦", "つながり", "創造", "効率"],
};

const CATEGORY_KEYS = Object.keys(FILTER_CATEGORIES);

const allMembers = DUMMY_ROOM_MEMBERS.flatMap((r) =>
  r.members.map((m) => ({
    ...m,
    roomName: r.roomName,
    allTags: [r.roomName, ...m.tags],
  }))
);

export default function MembersPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
    } else {
      setActiveCategory(cat);
    }
  };

  const filteredMembers = allMembers.filter(
    (m) =>
      selectedLabels.length === 0 ||
      selectedLabels.some((l) => m.allTags.includes(l))
  );

  const currentLabels = activeCategory ? FILTER_CATEGORIES[activeCategory] : [];

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

      {/* Stage 1: Category tabs */}
      <div
        className="shrink-0 flex gap-2 px-4 py-3 border-b border-gray-100"
        style={{ overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}
      >
        <button
          onClick={() => { setActiveCategory(null); setSelectedLabels([]); }}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategory === null && selectedLabels.length === 0
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          すべて
        </button>
        {CATEGORY_KEYS.map((cat) => {
          const isActive = activeCategory === cat;
          const hasSelection = selectedLabels.some((l) => FILTER_CATEGORIES[cat].includes(l));
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive || hasSelection
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
              {hasSelection && !isActive && (
                <span className="ml-1 text-xs opacity-70">
                  ({selectedLabels.filter((l) => FILTER_CATEGORIES[cat].includes(l)).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stage 2: Label chips (shown when a category is selected) */}
      {activeCategory && (
        <div
          className="shrink-0 flex gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100"
          style={{ overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}
        >
          {currentLabels.map((label) => {
            const selected = selectedLabels.includes(label);
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selected
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected labels summary + clear */}
      {selectedLabels.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{selectedLabels.length}個</span>のフィルタ適用中
          </span>
          <button
            onClick={() => setSelectedLabels([])}
            className="text-xs text-gray-400 active:opacity-60 transition-opacity"
          >
            クリア
          </button>
        </div>
      )}

      {/* Flat member list */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-12">
            該当するメンバーがいません
          </p>
        ) : (
          filteredMembers.map((member, i) => (
            <Link
              key={i}
              href={`/e/${inviteCode}/rooms/channels/members/${encodeURIComponent(member.name)}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                {member.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{member.name}</p>
                <div className="flex flex-wrap gap-1">
                  {member.allTags.map((tag) => {
                    const highlighted = selectedLabels.includes(tag);
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
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
