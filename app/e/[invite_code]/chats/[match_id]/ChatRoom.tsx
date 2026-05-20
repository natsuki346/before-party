"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Image, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DirectMessage } from "@/lib/supabase/types";

const COLORS = ["#4A90D9", "#7B61FF", "#E05C5C", "#27AE60", "#F39C12", "#8E44AD"];

function nameColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

function toTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

type UiMessage = {
  id: string;
  content: string;
  isMine: boolean;
  time: string;
};

function dbToUi(msg: DirectMessage, myId: string): UiMessage {
  return {
    id: msg.id,
    content: msg.content,
    isMine: msg.from_participant_id === myId,
    time: toTime(msg.created_at),
  };
}

function MessageBubble({
  msg,
  color,
  initial,
}: {
  msg: UiMessage;
  color: string;
  initial: string;
}) {
  const renderContent = () => {
    if (msg.content.startsWith("__image__")) {
      const src = msg.content.replace("__image__", "");
      return (
        <img
          src={src}
          alt="送信画像"
          style={{ maxWidth: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover", display: "block" }}
        />
      );
    }
    if (msg.content.startsWith("__voice__")) {
      const parts = msg.content.split("__").filter(Boolean);
      const url = parts[1];
      const sec = parts[2] ?? "0";
      return (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
          background: msg.isMine ? "black" : "white", borderRadius: 20,
        }}>
          <button
            onClick={() => { const a = new Audio(url); a.play(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: msg.isMine ? "white" : "black", fontSize: 16 }}
          >
            ▶
          </button>
          <div style={{ flex: 1, height: 3, background: msg.isMine ? "rgba(255,255,255,0.4)" : "#e5e7eb", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: msg.isMine ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{sec}秒</span>
        </div>
      );
    }
    return msg.content;
  };

  if (msg.isMine) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="max-w-[78%] bg-black text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed overflow-hidden">
          {renderContent()}
        </div>
        <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-end gap-1.5">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
        <div className="max-w-[78%] bg-white text-gray-900 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm border border-gray-100 overflow-hidden">
          {renderContent()}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{msg.time}</span>
      </div>
    </div>
  );
}

export default function ChatRoom({
  otherParticipantId,
  otherParticipantName,
  inviteCode,
}: {
  otherParticipantId: string;
  otherParticipantName: string;
  inviteCode: string;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const color = nameColor(otherParticipantName);
  const initial = otherParticipantName[0] ?? "?";

  // Initial load: resolve participantId, eventId, history
  useEffect(() => {
    (async () => {
      const pId = localStorage.getItem(`participant_${inviteCode}`);
      if (!pId) {
        setIsLoading(false);
        return;
      }
      setMyId(pId);

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
      setEventId(event.id);

      const convId = [pId, otherParticipantId].sort().join("|");
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs.map((m) => dbToUi(m as DirectMessage, pId)));
      }
      setIsLoading(false);
    })();
  }, [inviteCode, otherParticipantId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: receive messages from the other person
  useEffect(() => {
    if (!myId) return;
    const convId = [myId, otherParticipantId].sort().join("|");
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessage;
          // Own messages are already shown optimistically
          if (msg.from_participant_id === myId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, dbToUi(msg, myId)];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, otherParticipantId]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending || !myId || !eventId) return;
    setIsSending(true);
    setInput("");

    const optimisticId = `opt-${Date.now()}`;
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, content: text, isMine: true, time: now },
    ]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        event_id: eventId,
        from_participant_id: myId,
        to_participant_id: otherParticipantId,
        content: text,
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(text);
    } else if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? dbToUi(data as DirectMessage, myId) : m))
      );
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  // Image/voice: local only (not persisted, blob URLs can't be stored in DB)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: `img-${Date.now()}`, isMine: true, content: `__image__${url}`, time },
    ]);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [
          ...prev,
          { id: `voice-${Date.now()}`, isMine: true, content: `__voice__${url}__${recordingTime}`, time },
        ]);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert("マイクの許可が必要です");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setMediaRecorder(null);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  return (
    <main
      className="flex flex-col bg-gray-50 overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 bg-white border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/chats`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
        <h1 className="text-sm font-bold text-gray-900 truncate">{otherParticipantName}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-center text-xs text-gray-400 mt-10">読み込み中...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 mt-10">
            まだメッセージがありません。<br />最初の一言を送ってみましょう！
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} color={color} initial={initial} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: "none" }}
      />

      {/* Input area */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 active:opacity-70 transition-opacity shrink-0"
          aria-label="画像を送信"
        >
          <Image size={20} />
        </button>

        {isRecording ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "#fef2f2", borderRadius: 20, padding: "8px 16px",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
              animation: "pulse 1s infinite",
            }} />
            <span style={{ fontSize: 13, color: "#ef4444" }}>録音中 {recordingTime}秒</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="メッセージを入力"
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        )}

        {input.trim() ? (
          <button
            onClick={send}
            disabled={isSending}
            className="w-9 h-9 bg-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 active:opacity-70 transition-opacity"
            aria-label="送信"
          >
            <Send size={14} className="text-white" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isRecording ? "bg-red-500 scale-110" : "bg-gray-200"
            }`}
            aria-label="ボイスメッセージ"
          >
            <Mic size={16} className={isRecording ? "text-white" : "text-gray-600"} />
          </button>
        )}
      </div>
    </main>
  );
}
