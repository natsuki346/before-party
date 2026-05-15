"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const invite_code = generateInviteCode();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: form.title,
        description: form.description || null,
        event_date: new Date(form.event_date).toISOString(),
        invite_code,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/e/${data.invite_code}`);
  }

  return (
    <main className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">イベントを作成</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">イベント名 *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="例：エンジニア交流会"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
            placeholder="イベントの概要を入力"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">開催日時 *</label>
          <input
            type="datetime-local"
            required
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "作成中..." : "イベントを作成"}
        </button>
      </form>
    </main>
  );
}
