"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getConnections } from "@/lib/supabase/likes";

const COLORS = ["#4A90D9", "#7B61FF", "#E05C5C", "#27AE60", "#F39C12", "#8E44AD"];

function nameColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "昨日";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

type ChatItem = {
  participantId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  convId: string;
};

export default function ChatsPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const participantId = localStorage.getItem(`participant_${inviteCode}`);
      if (!participantId) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();
      if (!event) {
        setIsLoading(false);
        return;
      }

      const connectionIds = await getConnections(event.id, participantId);
      if (connectionIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: others } = await supabase
        .from("participants")
        .select("id, name")
        .in("id", connectionIds);
      if (!others) {
        setIsLoading(false);
        return;
      }

      const convIds = connectionIds.map((otherId) =>
        [participantId, otherId].sort().join("|")
      );

      const { data: recentMsgs } = await supabase
        .from("direct_messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
      for (const msg of recentMsgs ?? []) {
        if (!lastMsgMap[msg.conversation_id]) {
          lastMsgMap[msg.conversation_id] = {
            content: msg.content,
            created_at: msg.created_at,
          };
        }
      }

      const items: ChatItem[] = others.map((p) => {
        const convId = [participantId, p.id].sort().join("|");
        const last = lastMsgMap[convId];
        return {
          participantId: p.id,
          name: p.name,
          lastMessage: last?.content ?? "トークを始めましょう",
          lastTime: last ? formatTime(last.created_at) : "",
          convId,
        };
      });

      items.sort((a, b) => {
        const at = lastMsgMap[a.convId]?.created_at ?? "";
        const bt = lastMsgMap[b.convId]?.created_at ?? "";
        return bt.localeCompare(at);
      });

      setChats(items);
      setIsLoading(false);
    })();
  }, [inviteCode]);

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
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">読み込み中...</p>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 pt-20">
            <p className="text-base font-semibold text-gray-800 mb-1">まだトークがありません</p>
            <p className="text-sm text-gray-400">Matchタブで気になる人に「いいね」しよう</p>
          </div>
        ) : (
          chats.map((chat) => {
            const color = nameColor(chat.name);
            const initial = chat.name[0] ?? "?";
            return (
              <Link
                key={chat.participantId}
                href={`/e/${inviteCode}/chats/${chat.participantId}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-50 transition-colors border-b border-gray-50"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {chat.name}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-2 shrink-0">
                      {chat.lastTime}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
