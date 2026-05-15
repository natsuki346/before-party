"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

type Message = { id: string; sender: "me" | "other"; content: string; time: string };

function now() {
  return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        {/* Avatar */}
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
        {messages.map((msg) =>
          msg.sender === "me" ? (
            // Own message — right side, black bubble
            <div key={msg.id} className="flex flex-col items-end gap-0.5">
              <div className="max-w-[78%] bg-black text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          ) : (
            // Other's message — left side, white bubble
            <div key={msg.id} className="flex flex-col items-start gap-0.5">
              <div className="flex items-end gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <div className="max-w-[78%] bg-white text-gray-900 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm border border-gray-100">
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{msg.time}</span>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="メッセージを入力"
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-9 h-9 bg-black rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 active:opacity-70 transition-opacity"
          aria-label="送信"
        >
          <Send size={14} className="text-white" strokeWidth={2.5} />
        </button>
      </div>
    </main>
  );
}
