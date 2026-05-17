"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type ChatItem = {
  match_id: string;
  name: string;
  initial: string;
  color: string;
  lastMessage: string;
  time: string;
  unread: number;
};

const DUMMY_CHATS: ChatItem[] = [
  {
    match_id: "match-1",
    name: "田中 太郎",
    initial: "田",
    color: "#4A90D9",
    lastMessage: "ぜひ話しましょう！",
    time: "14:30",
    unread: 2,
  },
  {
    match_id: "match-2",
    name: "佐藤 花子",
    initial: "佐",
    color: "#7B61FF",
    lastMessage: "よろしくお願いします",
    time: "昨日",
    unread: 0,
  },
  {
    match_id: "match-3",
    name: "鈴木 一郎",
    initial: "鈴",
    color: "#E05C5C",
    lastMessage: "また今度！",
    time: "月曜",
    unread: 0,
  },
];

export default function ChatsPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  return (
    <main
      className="flex flex-col bg-white overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/members`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">トーク</h1>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {DUMMY_CHATS.map((chat) => (
          <Link
            key={chat.match_id}
            href={`/e/${inviteCode}/chats/${chat.match_id}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-50 transition-colors border-b border-gray-50"
          >
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
              style={{ backgroundColor: chat.color }}
            >
              {chat.initial}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {chat.name}
                </span>
                <span className="text-[11px] text-gray-400 ml-2 shrink-0">{chat.time}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
            </div>

            {/* Unread badge */}
            {chat.unread > 0 && (
              <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                {chat.unread}
              </div>
            )}
          </Link>
        ))}

        {DUMMY_CHATS.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 pt-20">
            <p className="text-base font-semibold text-gray-800 mb-1">まだトークがありません</p>
            <p className="text-sm text-gray-400">Matchタブで気になる人に「いいね」しよう</p>
          </div>
        )}
      </div>
    </main>
  );
}
