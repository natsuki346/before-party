"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Image, Mic } from "lucide-react";

type Message = { id: string; sender: "me" | "other"; content: string; time: string };

function now() {
  return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, color, initial }: { msg: Message; color: string; initial: string }) {
  const isMine = msg.sender === "me";

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
          background: isMine ? "black" : "white", borderRadius: 20,
        }}>
          <button
            onClick={() => { const a = new Audio(url); a.play(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: isMine ? "white" : "black", fontSize: 16 }}
          >
            ▶
          </button>
          <div style={{ flex: 1, height: 3, background: isMine ? "rgba(255,255,255,0.4)" : "#e5e7eb", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: isMine ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{sec}秒</span>
        </div>
      );
    }

    return msg.content;
  };

  if (isMine) {
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
  name,
  initial,
  color,
  initialMessages,
  inviteCode,
}: {
  name: string;
  initial: string;
  color: string;
  initialMessages: Message[];
  inviteCode: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, sender: "me", content: text, time: now() },
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { id: `img-${Date.now()}`, sender: "me", content: `__image__${url}`, time: now() },
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
        setMessages((prev) => [
          ...prev,
          { id: `voice-${Date.now()}`, sender: "me", content: `__voice__${url}__${recordingTime}`, time: now() },
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
        <h1 className="text-sm font-bold text-gray-900 truncate">{name}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} color={color} initial={initial} />
        ))}
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
        {/* Image button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 active:opacity-70 transition-opacity shrink-0"
          aria-label="画像を送信"
        >
          <Image size={20} />
        </button>

        {/* Text input or recording indicator */}
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

        {/* Send or mic button */}
        {input.trim() ? (
          <button
            onClick={send}
            className="w-9 h-9 bg-black rounded-full flex items-center justify-center shrink-0 active:opacity-70 transition-opacity"
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
