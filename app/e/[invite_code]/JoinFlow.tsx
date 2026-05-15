"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/supabase/types";

const LIFE_STAGES = ["学生", "社会人（会社員）", "フリーランス", "起業家", "その他"];

const WORRIES_OPTIONS = [
  "キャリアの方向性",
  "人間関係",
  "お金・資産",
  "健康・体力",
  "時間の使い方",
  "スキルアップ",
  "家族・パートナー",
  "仕事のやりがい",
];

const VALUES_OPTIONS = [
  "自由",
  "安定",
  "成長",
  "貢献",
  "挑戦",
  "つながり",
  "創造",
  "効率",
];

type Step = "name" | "profile";

export default function JoinFlow({ event }: { event: Event }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    life_stage: "",
    work_context: "",
    worries: [] as string[],
    values: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("participants")
      .insert({ event_id: event.id, name })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    localStorage.setItem(`participant_${event.invite_code}`, data.id);
    setParticipantId(data.id);
    setStep("profile");
    setLoading(false);
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!participantId) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("profiles").insert({
      participant_id: participantId,
      life_stage: profile.life_stage || null,
      work_context: profile.work_context || null,
      worries: profile.worries.length ? profile.worries : null,
      values: profile.values.length ? profile.values : null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/e/${event.invite_code}/members`);
  }

  function toggleArray(key: "worries" | "values", value: string) {
    setProfile((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  const eventDate = new Date(event.event_date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="max-w-lg mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{eventDate}</p>
        {event.description && (
          <p className="text-gray-600 mt-2 text-sm">{event.description}</p>
        )}
      </div>

      {step === "name" && (
        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">あなたのお名前を教えてください</h2>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="例：田中 太郎"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "次へ"}
          </button>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold">プロフィールを教えてください</h2>

          <div>
            <label className="block text-sm font-medium mb-2">ライフステージ</label>
            <div className="flex flex-wrap gap-2">
              {LIFE_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setProfile({ ...profile, life_stage: stage })}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    profile.life_stage === stage
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              仕事・活動の内容（自由記述）
            </label>
            <input
              type="text"
              value={profile.work_context}
              onChange={(e) => setProfile({ ...profile, work_context: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="例：Webエンジニア、スタートアップでプロダクト開発"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              最近の悩み（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {WORRIES_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleArray("worries", w)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    profile.worries.includes(w)
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              大切にしている価値観（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {VALUES_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleArray("values", v)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    profile.values.includes(v)
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "参加者一覧を見る"}
          </button>
        </form>
      )}
    </main>
  );
}
