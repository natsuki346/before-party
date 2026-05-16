"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LIFE_STAGES = [
  "学生",
  "社会人（20代）",
  "社会人（30代）",
  "社会人（40代以上）",
  "フリーランス",
  "その他",
];

const WORK_CONTEXTS = [
  "エンジニア・IT系",
  "クリエイター・デザイナー",
  "営業・ビジネス系",
  "研究・教育系",
  "医療・福祉系",
  "その他",
];

const WORRIES_OPTIONS = [
  "キャリアのこと",
  "人間関係",
  "お金・将来のこと",
  "健康・生活習慣",
  "恋愛・結婚",
  "趣味・やりたいことが見つからない",
];

const VALUES_OPTIONS = [
  "自由・自分らしさ",
  "成長・チャレンジ",
  "人とのつながり",
  "安定・安心",
  "楽しむこと",
  "社会への貢献",
];

type TagButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  activeStyle: string;
};

function TagButton({ label, active, onClick, activeStyle }: TagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
        active ? activeStyle : "border-gray-200 text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [lifeStage, setLifeStage] = useState("");
  const [workContext, setWorkContext] = useState("");
  const [worries, setWorries] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noParticipant, setNoParticipant] = useState(false);

  useEffect(() => {
    (async () => {
      const participantId = localStorage.getItem(`participant_${inviteCode}`);
      if (!participantId) {
        setNoParticipant(true);
        setIsLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("participant_id", participantId)
          .single();
        if (prof) {
          setLifeStage(prof.life_stage ?? "");
          setWorkContext(prof.work_context ?? "");
          setWorries(prof.worries ?? []);
          setValues(prof.values ?? []);
        }
      } catch {
        // keep defaults
      }
      setIsLoading(false);
    })();
  }, [inviteCode]);

  const toggleArr = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((cur) =>
      cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]
    );
  };

  const handleSave = async () => {
    const participantId = localStorage.getItem(`participant_${inviteCode}`);
    if (!participantId) return;
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase.from("profiles").upsert({
        participant_id: participantId,
        life_stage: lifeStage || null,
        work_context: workContext || null,
        worries: worries.length ? worries : null,
        values: values.length ? values : null,
      });
      if (upsertError) throw upsertError;
      router.push(`/e/${inviteCode}/members`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main
        className="flex items-center justify-center bg-white"
        style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
      >
        <p className="text-sm text-gray-400">読み込み中...</p>
      </main>
    );
  }

  if (noParticipant) {
    return (
      <main
        className="flex flex-col items-center justify-center gap-3 bg-white"
        style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
      >
        <p className="text-sm text-gray-500">まずイベントに参加してください</p>
        <button
          onClick={() => router.push(`/e/${inviteCode}`)}
          className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold"
        >
          参加する
        </button>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col bg-white"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center px-4 border-b border-gray-100">
        <h1 className="text-sm font-bold text-gray-900">プロフィール編集</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-7">

        {/* Life stage */}
        <section className="flex flex-col gap-2.5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            ライフステージ
          </h2>
          <div className="flex flex-wrap gap-2">
            {LIFE_STAGES.map((s) => (
              <TagButton
                key={s}
                label={s}
                active={lifeStage === s}
                onClick={() => setLifeStage(s)}
                activeStyle="bg-gray-900 text-white border-gray-900"
              />
            ))}
          </div>
        </section>

        {/* Work context */}
        <section className="flex flex-col gap-2.5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            仕事・活動スタイル
          </h2>
          <div className="flex flex-wrap gap-2">
            {WORK_CONTEXTS.map((w) => (
              <TagButton
                key={w}
                label={w}
                active={workContext === w}
                onClick={() => setWorkContext(w)}
                activeStyle="bg-gray-900 text-white border-gray-900"
              />
            ))}
          </div>
        </section>

        {/* Worries */}
        <section className="flex flex-col gap-2.5">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              最近の悩み
            </h2>
            <p className="text-[10px] text-gray-300 mt-0.5">複数選択できます</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WORRIES_OPTIONS.map((w) => (
              <TagButton
                key={w}
                label={w}
                active={worries.includes(w)}
                onClick={() => toggleArr(w, setWorries)}
                activeStyle="bg-orange-100 text-orange-700 border-orange-200"
              />
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="flex flex-col gap-2.5">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              大切にしていること
            </h2>
            <p className="text-[10px] text-gray-300 mt-0.5">複数選択できます</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VALUES_OPTIONS.map((v) => (
              <TagButton
                key={v}
                label={v}
                active={values.includes(v)}
                onClick={() => toggleArr(v, setValues)}
                activeStyle="bg-blue-100 text-blue-700 border-blue-200"
              />
            ))}
          </div>
        </section>

        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-gray-900 text-white active:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? "保存中..." : "保存する"}
        </button>

        <div className="h-2" />
      </div>
    </main>
  );
}
