"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LIFE_STAGES = ["学生", "社会人（会社員）", "フリーランス", "起業家", "その他"];
const WORRIES_OPTIONS = ["キャリアの方向性", "人間関係", "お金・資産", "健康・体力", "時間の使い方", "スキルアップ", "家族・パートナー", "仕事のやりがい"];
const VALUES_OPTIONS  = ["自由", "安定", "成長", "貢献", "挑戦", "つながり", "創造", "効率"];

type Profile = {
  name: string;
  life_stage: string;
  work_context: string;
  worries: string[];
  values: string[];
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsEditPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [profile, setProfile] = useState<Profile>({
    name: "",
    life_stage: "",
    work_context: "",
    worries: [],
    values: [],
  });
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const participantId = localStorage.getItem(`participant_${inviteCode}`);
      if (!participantId) {
        setIsLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const [{ data: participant }, { data: prof }] = await Promise.all([
          supabase.from("participants").select("name").eq("id", participantId).single(),
          supabase.from("profiles").select("*").eq("participant_id", participantId).single(),
        ]);
        setProfile({
          name: participant?.name ?? "",
          life_stage: prof?.life_stage ?? "",
          work_context: prof?.work_context ?? "",
          worries: prof?.worries ?? [],
          values: prof?.values ?? [],
        });
      } catch {
        // keep empty defaults
      }
      setIsLoading(false);
    })();
  }, [inviteCode]);

  const toggle = (key: "worries" | "values", val: string) => {
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter((v) => v !== val) : [...p[key], val],
    }));
  };

  const handleSave = async () => {
    const participantId = localStorage.getItem(`participant_${inviteCode}`);
    if (!participantId) return;
    try {
      const supabase = createClient();
      await supabase.from("profiles").upsert({
        participant_id: participantId,
        life_stage: profile.life_stage || null,
        work_context: profile.work_context || null,
        worries: profile.worries.length ? profile.worries : null,
        values: profile.values.length ? profile.values : null,
      });
    } catch {
      // ignore errors in demo
    }
    setSaved(true);
    setTimeout(() => {
      router.push(`/e/${inviteCode}/settings`);
    }, 2000);
  };

  return (
    <main
      className="flex flex-col bg-white overflow-hidden"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/settings`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-900" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">プロフィール編集</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {isLoading ? (
          <p className="text-sm text-gray-900 text-center py-8">読み込み中...</p>
        ) : (
          <>
            {/* Profile section */}
            <section>
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                プロフィール
              </h2>
              <div className="flex flex-col gap-3">
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-gray-900 mb-1 block">名前</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="例：田中 太郎"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus:border-gray-900 transition-colors"
                  />
                </div>

                {/* Life stage */}
                <div>
                  <label className="text-xs font-medium text-gray-900 mb-2 block">ライフステージ</label>
                  <div style={{ display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "4px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                    {LIFE_STAGES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, life_stage: s }))}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors shrink-0 whitespace-nowrap ${
                          profile.life_stage === s
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-900"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work context */}
                <div>
                  <label className="text-xs font-medium text-gray-900 mb-1 block">仕事・活動内容</label>
                  <input
                    type="text"
                    value={profile.work_context}
                    onChange={(e) => setProfile((p) => ({ ...p, work_context: e.target.value }))}
                    placeholder="例：Webエンジニア、スタートアップ"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus:border-gray-900 transition-colors"
                  />
                </div>

                {/* Worries */}
                <div>
                  <label className="text-xs font-medium text-gray-900 mb-2 block">最近の悩み</label>
                  <div style={{ display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "4px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                    {WORRIES_OPTIONS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => toggle("worries", w)}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors shrink-0 whitespace-nowrap ${
                          profile.worries.includes(w)
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : "border-gray-200 text-gray-900"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div>
                  <label className="text-xs font-medium text-gray-900 mb-2 block">大切にしている価値観</label>
                  <div style={{ display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "4px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                    {VALUES_OPTIONS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggle("values", v)}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors shrink-0 whitespace-nowrap ${
                          profile.values.includes(v)
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-900"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Notification section */}
            <section>
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                通知
              </h2>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <Bell size={16} className="text-gray-900" />
                  <span className="text-sm text-gray-900">プッシュ通知</span>
                </div>
                <Toggle checked={notifEnabled} onChange={setNotifEnabled} />
              </div>
            </section>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saved}
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-gray-900 text-white active:opacity-80"
              }`}
            >
              {saved ? "保存しました ✓" : "保存する"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
