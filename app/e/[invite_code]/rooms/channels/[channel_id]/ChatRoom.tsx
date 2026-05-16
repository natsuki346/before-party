"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Room, RoomMessage } from "@/lib/supabase/types";

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
        // Revert optimistic update
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
  );
}
