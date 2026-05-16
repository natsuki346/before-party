"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Tag categories (excluding work_context which uses WORK_CATEGORIES) ───────
const TAG_CATEGORIES = [
  {
    label: "ライフステージ",
    key: "life_stage" as const,
    multi: false,
    tags: ["学生", "社会人（会社員）", "フリーランス", "起業家", "その他"],
  },
  {
    label: "悩み",
    key: "worries" as const,
    multi: true,
    tags: ["キャリアの方向性", "人間関係", "お金・資産", "健康・体力", "時間の使い方", "スキルアップ", "家族・パートナー", "仕事のやりがい"],
  },
  {
    label: "価値観",
    key: "values" as const,
    multi: true,
    tags: ["自由", "安定", "成長", "貢献", "挑戦", "つながり", "創造", "効率"],
  },
];

// ─── 3-tier work categories ───────────────────────────────────────────────────
const WORK_CATEGORIES = [
  {
    label: "IT・テック",
    jobs: [
      { label: "エンジニア", details: ["フロントエンド", "バックエンド", "モバイル", "AI・ML", "インフラ・SRE", "フルスタック"] },
      { label: "デザイナー", details: ["UIデザイン", "グラフィック", "プロダクトデザイン", "UXリサーチ"] },
      { label: "PM・PdM", details: ["プロダクトマネージャー", "プロジェクトマネージャー"] },
      { label: "データ・AI", details: ["データアナリスト", "データサイエンティスト", "MLエンジニア"] },
    ],
  },
  {
    label: "ビジネス",
    jobs: [
      { label: "営業", details: ["法人営業", "個人営業", "インサイドセールス", "カスタマーサクセス"] },
      { label: "マーケター", details: ["デジタルマーケ", "コンテンツマーケ", "ブランドマーケ", "グロースハック"] },
      { label: "経営・起業", details: ["CEO・創業者", "COO", "事業開発", "スタートアップ"] },
      { label: "コンサル・金融", details: ["経営コンサル", "ITコンサル", "投資・VC", "会計・税務"] },
    ],
  },
  {
    label: "クリエイティブ",
    jobs: [
      { label: "クリエイター", details: ["動画・映像", "写真", "イラスト", "音楽"] },
      { label: "ライター", details: ["Webライター", "コピーライター", "編集者"] },
      { label: "アーティスト", details: ["グラフィックアート", "インスタレーション", "パフォーマンス"] },
    ],
  },
  {
    label: "医療・教育",
    jobs: [
      { label: "医療・福祉", details: ["医師・看護師", "薬剤師", "福祉・介護", "心理・カウンセラー"] },
      { label: "教育・研究", details: ["教師・講師", "大学・研究者", "塾・家庭教師", "EdTech"] },
    ],
  },
  {
    label: "その他",
    jobs: [
      { label: "フリーランス", details: ["複業・副業", "ノマドワーカー"] },
      { label: "学生", details: ["大学生", "大学院生", "専門学生"] },
      { label: "その他", details: ["その他"] },
    ],
  },
];

const ALL_TAB = "すべて";
const WORK_TAB = "仕事・職種";
const TABS = [ALL_TAB, "ライフステージ", WORK_TAB, "悩み", "価値観"];

type ProfileKey = "life_stage" | "worries" | "values";

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
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [workCategoryIdx, setWorkCategoryIdx] = useState(0);
  const [openJob, setOpenJob] = useState<string | null>(null);
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

  // work_context stored as comma-separated detail labels
  const selectedWorkDetails = profile.work_context
    ? profile.work_context.split(", ").filter(Boolean)
    : [];

  const toggleWorkDetail = (detail: string) => {
    const updated = selectedWorkDetails.includes(detail)
      ? selectedWorkDetails.filter((d) => d !== detail)
      : [...selectedWorkDetails, detail];
    setProfile((p) => ({ ...p, work_context: updated.join(", ") }));
  };

  const handleTagTap = (key: ProfileKey, multi: boolean, tag: string) => {
    if (!multi) {
      setProfile((p) => ({ ...p, [key]: (p[key] as string) === tag ? "" : tag }));
    } else {
      setProfile((p) => {
        const arr = p[key] as string[];
        return { ...p, [key]: arr.includes(tag) ? arr.filter((v) => v !== tag) : [...arr, tag] };
      });
    }
  };

  const isSelected = (key: ProfileKey, multi: boolean, tag: string): boolean => {
    if (!multi) return (profile[key] as string) === tag;
    return (profile[key] as string[]).includes(tag);
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

  const showWork = activeTab === ALL_TAB || activeTab === WORK_TAB;
  const visibleTagCategories =
    activeTab === ALL_TAB
      ? TAG_CATEGORIES
      : TAG_CATEGORIES.filter((c) => c.label === activeTab);

  const WorkSection = () => (
    <div>
      {activeTab === ALL_TAB && (
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            仕事・職種
          </p>
        </div>
      )}

      {/* Big category tabs */}
      <div
        className="px-5 py-3 border-b border-gray-100"
        style={{ overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}
      >
        <div className="flex gap-2">
          {WORK_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.label}
              onClick={() => { setWorkCategoryIdx(idx); setOpenJob(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                workCategoryIdx === idx ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job list with accordion */}
      {WORK_CATEGORIES[workCategoryIdx].jobs.map((job) => (
        <div key={job.label}>
          <button
            type="button"
            onClick={() => setOpenJob(openJob === job.label ? null : job.label)}
            className="w-full flex items-center justify-between px-5 border-b border-gray-100 bg-white active:bg-gray-50 transition-colors"
            style={{ height: "48px" }}
          >
            <span className="text-sm text-gray-900">{job.label}</span>
            {openJob === job.label
              ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
              : <ChevronRight size={16} className="text-gray-400 shrink-0" />
            }
          </button>

          {openJob === job.label && job.details.map((detail) => {
            const selected = selectedWorkDetails.includes(detail);
            return (
              <button
                key={detail}
                type="button"
                onClick={() => toggleWorkDetail(detail)}
                className={`w-full flex items-center justify-between pl-10 pr-5 border-b border-gray-100 transition-colors active:bg-gray-100 ${
                  selected ? "bg-gray-50" : "bg-gray-50/60"
                }`}
                style={{ height: "44px" }}
              >
                <span className="text-sm text-gray-700">{detail}</span>
                {selected && <Check size={15} className="text-gray-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

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
      <div className="flex-1 overflow-y-auto flex flex-col">
        {isLoading ? (
          <p className="text-sm text-gray-900 text-center py-8">読み込み中...</p>
        ) : (
          <>
            {/* Name */}
            <div className="px-5 py-4">
              <label className="text-xs font-medium text-gray-900 mb-1 block">名前</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="例：田中 太郎"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus:border-gray-900 transition-colors"
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* Main category tabs */}
            <div
              className="shrink-0 px-5 py-3 border-b border-gray-100"
              style={{ overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}
            >
              <div className="flex gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      activeTab === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag list */}
            <div>
              {/* Work section */}
              {showWork && <WorkSection />}

              {/* Other tag categories */}
              {visibleTagCategories.map((cat) => (
                <div key={cat.key}>
                  {activeTab === ALL_TAB && (
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {cat.label}
                      </p>
                    </div>
                  )}
                  {cat.tags.map((tag) => {
                    const selected = isSelected(cat.key, cat.multi, tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagTap(cat.key, cat.multi, tag)}
                        className={`w-full flex items-center justify-between px-5 border-b border-gray-100 transition-colors active:bg-gray-50 ${
                          selected ? "bg-gray-50" : "bg-white"
                        }`}
                        style={{ height: "48px" }}
                      >
                        <span className="text-sm text-gray-900">{tag}</span>
                        {selected && <Check size={16} className="text-gray-900 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100" />

            {/* Notification + Save */}
            <div className="px-5 py-4 flex flex-col gap-6">
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

              <button
                onClick={handleSave}
                disabled={saved}
                className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                  saved ? "bg-green-500 text-white" : "bg-gray-900 text-white active:opacity-80"
                }`}
              >
                {saved ? "保存しました ✓" : "保存する"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
