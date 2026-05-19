"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Room, RoomMessage } from "@/lib/supabase/types";

const DUMMY_MEMBERS = [
  { display_name: "田中 太郎", profiles: { life_stage: "社会人（会社員）", work_context: "エンジニア",  values: ["成長", "挑戦"] } },
  { display_name: "佐藤 花子", profiles: { life_stage: "フリーランス",      work_context: "UIデザイン",  values: ["自由", "創造"] } },
  { display_name: "鈴木 一郎", profiles: { life_stage: "起業家",            work_context: "経営者",      values: ["貢献", "挑戦"] } },
  { display_name: "山田 美咲", profiles: { life_stage: "社会人（会社員）", work_context: "マーケター",  values: ["安定", "つながり"] } },
  { display_name: "伊藤 健",   profiles: { life_stage: "フリーランス",      work_context: "バックエンド", values: ["効率", "成長"] } },
];

// NamePrompt — shown once when senderName is not yet set
function NamePrompt({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="shrink-0 bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center gap-2">
      <input
        type="text"
        placeholder="表示名を入力してください"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name)}
        autoFocus
        className="flex-1 bg-white border border-yellow-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <button
        onClick={() => name.trim() && onSave(name)}
        disabled={!name.trim()}
        className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold disabled:opacity-40"
      >
        設定
      </button>
      <button onClick={onClose} className="text-xs text-gray-400 shrink-0">
        後で
      </button>
    </div>
  );
}

// MessageBubble — own messages on right, others on left
function MessageBubble({
  message,
  isMine,
}: {
  message: RoomMessage;
  isMine: boolean;
}) {
  const time = new Date(message.created_at).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isMine) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="max-w-[78%] bg-black text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 px-1">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[11px] text-gray-500 px-1">{message.sender_name}</span>
      <div className="flex items-end gap-1.5">
        <div className="max-w-[78%] bg-white text-gray-900 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm border border-gray-100">
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{time}</span>
      </div>
    </div>
  );
}

export default function ChatRoom({
  room,
  initialMessages,
  inviteCode,
  isDummy,
}: {
  room: Room;
  initialMessages: RoomMessage[];
  inviteCode: string;
  isDummy: boolean;
}) {
  const [messages, setMessages] = useState<RoomMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load stored display name
  useEffect(() => {
    const stored = localStorage.getItem(`chat_name_${inviteCode}`);
    if (stored) setSenderName(stored);
  }, [inviteCode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime (real mode only)
  useEffect(() => {
    if (isDummy) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const msg = payload.new as RoomMessage;
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id, isDummy]);

  // Record room entry in room_participants
  useEffect(() => {
    if (isDummy) return;
    const participantId = localStorage.getItem(`participant_${inviteCode}`);
    const name = localStorage.getItem(`chat_name_${inviteCode}`) || "ゲスト";
    const supabase = createClient();
    supabase.from("room_participants").upsert({
      room_id: room.id,
      participant_id: participantId || null,
      display_name: name,
    }, { onConflict: "room_id,participant_id" }).then(() => {});
  }, [room.id, inviteCode, isDummy]);

  // Fetch members when panel opens
  useEffect(() => {
    if (!showMembers || isDummy) {
      if (isDummy) setMembers(DUMMY_MEMBERS);
      return;
    }
    const supabase = createClient();
    supabase
      .from("room_participants")
      .select(`
        display_name,
        participant_id,
        profiles (
          life_stage,
          work_context,
          values
        )
      `)
      .eq("room_id", room.id)
      .then(({ data }) => {
        if (data) setMembers(data as any[]);
      });
  }, [showMembers, room.id, isDummy]);

  const send = async () => {
    const text = content.trim();
    if (!text || isSending) return;

    const name = senderName.trim();
    if (!name) {
      setShowNamePrompt(true);
      return;
    }

    setIsSending(true);
    setContent("");

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: RoomMessage = {
      id: optimisticId,
      room_id: room.id,
      sender_name: name,
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    if (!isDummy) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("room_messages")
        .insert({ room_id: room.id, sender_name: name, content: text })
        .select()
        .single();

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setContent(text);
      } else if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data : m))
        );
      }
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const saveName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem(`chat_name_${inviteCode}`, trimmed);
    setSenderName(trimmed);
    setShowNamePrompt(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <main
        className="flex flex-col overflow-hidden bg-gray-50"
        style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
      >
        {/* Header */}
        <div className="shrink-0 h-12 flex items-center gap-2 px-3 bg-white border-b border-gray-100">
          <Link
            href={`/e/${inviteCode}/rooms/channels`}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </Link>
          <span className="text-gray-400 text-base">#</span>
          <h1 className="text-sm font-bold text-gray-900 truncate">{room.name}</h1>
          <button
            onClick={() => setShowMembers(true)}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="メンバー一覧"
          >
            <Users size={18} className="text-gray-700" />
          </button>
        </div>

        {/* Name prompt banner */}
        {showNamePrompt && (
          <NamePrompt onSave={saveName} onClose={() => setShowNamePrompt(false)} />
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-10">
              まだメッセージがありません。<br />最初の一言を送ってみましょう！
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_name === senderName}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={senderName ? "メッセージを入力" : "名前を設定して送信できます"}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
          <button
            onClick={send}
            disabled={!content.trim() || isSending}
            className="w-9 h-9 bg-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 active:opacity-70 transition-opacity"
            aria-label="送信"
          >
            <Send size={14} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
      </main>

      {/* Members bottom sheet */}
      {showMembers && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowMembers(false)} />
          <div style={{ position: "relative", width: "390px", maxHeight: "75dvh", background: "white", borderRadius: "20px 20px 0 0", display: "flex", flexDirection: "column", zIndex: 1 }}>
            <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "12px auto 0" }} />
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>メンバー ({members.length}人)</h2>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {members.map((m, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>
                    {m.display_name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{m.display_name}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {m.profiles?.life_stage && (
                        <span style={{ fontSize: 11, background: "#f3f4f6", borderRadius: 999, padding: "2px 8px", color: "#6b7280" }}>
                          #{m.profiles.life_stage}
                        </span>
                      )}
                      {m.profiles?.work_context && (
                        <span style={{ fontSize: 11, background: "#f3f4f6", borderRadius: 999, padding: "2px 8px", color: "#6b7280" }}>
                          #{m.profiles.work_context}
                        </span>
                      )}
                      {(m.profiles?.values ?? []).map((v: string) => (
                        <span key={v} style={{ fontSize: 11, background: "#f3f4f6", borderRadius: 999, padding: "2px 8px", color: "#6b7280" }}>
                          #{v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
