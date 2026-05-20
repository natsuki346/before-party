"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/e/${trimmed}/members`);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh bg-white px-8">
      <div className="w-full max-w-[390px] flex flex-col gap-8">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">before party</h1>
          <p className="text-sm text-gray-400">招待コードを入力してイベントに参加</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="招待コードを入力"
            autoFocus
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 transition-colors text-center tracking-widest font-mono"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-black text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-30 active:opacity-70 transition-opacity"
          >
            参加する
          </button>
        </form>
      </div>
    </main>
  );
}
