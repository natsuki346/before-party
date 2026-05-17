"use client";

import { useState } from "react";
import Link from "next/link";
import { Hash, Plus, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event, Room } from "@/lib/supabase/types";

const CATEGORY_TABS = ["すべて", "属性", "目的", "職種", "年齢"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

type ParentTab = "default" | "original";

type PresetRoom = { id: string; name: string; tab: Exclude<CategoryTab, "すべて">; count: number };

const PRESET_ROOMS: PresetRoom[] = [
  // 属性
  { id: "r-childcare",   name: "子育て中",       tab: "属性", count: 8  },
  { id: "r-entrepreneur",name: "起業家",          tab: "属性", count: 5  },
  { id: "r-freelance",   name: "フリーランス",    tab: "属性", count: 12 },
  { id: "r-employee",    name: "会社員",          tab: "属性", count: 15 },
  { id: "r-student",     name: "学生",            tab: "属性", count: 3  },
  // 目的
  { id: "r-career",      name: "キャリア相談",    tab: "目的", count: 9  },
  { id: "r-money",       name: "お金の話",        tab: "目的", count: 7  },
  { id: "r-relations",   name: "人間関係",        tab: "目的", count: 4  },
  { id: "r-skills",      name: "スキルアップ",    tab: "目的", count: 11 },
  // 職種
  { id: "r-engineer",    name: "エンジニア",      tab: "職種", count: 14 },
  { id: "r-designer",    name: "デザイナー",      tab: "職種", count: 6  },
  { id: "r-sales",       name: "営業",            tab: "職種", count: 8  },
  { id: "r-marketer",    name: "マーケター",      tab: "職種", count: 5  },
  // 年齢
  { id: "r-20s",         name: "20代",            tab: "年齢", count: 18 },
  { id: "r-30s",         name: "30代",            tab: "年齢", count: 22 },
  { id: "r-40plus",      name: "40代以上",        tab: "年齢", count: 9  },
];

export default function ChannelList({
  event,
  userRooms,
  inviteCode,
  isDummy,
}: {
  event: Event;
  userRooms: Room[];
  inviteCode: string;
  isDummy: boolean;
}) {
  const [parentTab, setParentTab]   = useState<ParentTab>("default");
  const [activeTab, setActiveTab]   = useState<CategoryTab>("すべて");
  const [extraRooms, setExtraRooms] = useState<Room[]>(userRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName]     = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const visiblePresets =
    activeTab === "すべて"
      ? PRESET_ROOMS
      : PRESET_ROOMS.filter((r) => r.tab === activeTab);

  const handleCreate = async () => {
    const name = roomName.trim();
    if (!name || isCreating) return;
    setIsCreating(true);

    if (isDummy) {
      const newRoom: Room = {
        id: `local-${Date.now()}`,
        event_id: event.id,
        name,
        created_at: new Date().toISOString(),
      };
      setExtraRooms((prev) => [...prev, newRoom]);
    } else {
      const supabase = createClient();
      const { data } = await supabase
        .from("rooms")
        .insert({ event_id: event.id, name })
        .select()
        .single();
      if (data) setExtraRooms((prev) => [...prev, data]);
    }

    setRoomName("");
    setIsModalOpen(false);
    setIsCreating(false);
  };

  return (
    <main
      className="flex flex-col overflow-hidden bg-white"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center px-4 border-b border-gray-100">
        <h1 className="text-sm font-bold text-gray-900 truncate flex-1">{event.title}</h1>
        <Link
          href={`/e/${inviteCode}/rooms/channels/members`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
          aria-label="参加者一覧"
        >
          <Users size={18} className="text-gray-700" />
        </Link>
      </div>

      {/* ── Parent tabs (デフォルト | オリジナル) ── */}
      <div className="shrink-0 flex border-b border-gray-100">
        {(["default", "original"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setParentTab(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
              parentTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab === "default" ? "デフォルト" : "オリジナル"}
          </button>
        ))}
      </div>

      {parentTab === "default" ? (
        /* ── DEFAULT: category tabs + preset rooms ── */
        <>
          {/* Category tab bar */}
          <div
            className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {visiblePresets.map((room) => (
              <Link
                key={room.id}
                href={`/e/${inviteCode}/rooms/channels/${room.id}`}
                className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
              >
                <Hash size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800 flex-1">{room.name}</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                  <Users size={11} />
                  {room.count}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        /* ── ORIGINAL: create button + user rooms ── */
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Prominent create CTA */}
          <div className="px-4 py-4 border-b border-gray-100">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-semibold active:opacity-80 transition-opacity"
            >
              <Plus size={17} />
              ルームを作る
            </button>
          </div>

          {/* User-created rooms */}
          <div className="flex-1 px-3 py-2">
            {extraRooms.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-10">
                まだオリジナルルームがありません
              </p>
            ) : (
              extraRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/e/${inviteCode}/rooms/channels/${room.id}`}
                  className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
                >
                  <Hash size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{room.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                    <Users size={11} />1
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create room modal — shared across both tabs */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-[390px] px-6 pt-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold">ルームを作る</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              placeholder="ルーム名を入力"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={!roomName.trim() || isCreating}
              className="w-full mt-3 bg-black text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              {isCreating ? "作成中..." : "作成する"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
