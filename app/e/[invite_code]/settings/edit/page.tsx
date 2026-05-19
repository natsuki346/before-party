"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────
const LIFE_STAGES = ["学生", "社会人（会社員）", "フリーランス", "起業家", "その他"];
const VALUES_OPTIONS = ["自由", "安定", "成長", "貢献", "挑戦", "つながり", "創造", "効率"];

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

const SECTIONS = ["基本情報", "ライフステージ", "仕事・職種", "価値観", "アカウント"] as const;
type Section = typeof SECTIONS[number];

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = {
  name: string;
  life_stage: string;
  work_context: string;
  worries: string[];
  values: string[];
};

// ─── Components ───────────────────────────────────────────────────────────────
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

function SaveButton({ saved, isSaving, onClick }: { saved: boolean; isSaving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saved || isSaving}
      className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
        saved ? "bg-green-500 text-white" : "bg-gray-900 text-white active:opacity-80 disabled:opacity-50"
      }`}
    >
      {saved ? "保存しました ✓" : "保存する"}
    </button>
  );
}

// ─── SearchBar ─────────────────────────────────────────────────────────────
function SearchBar({
  searchQuery,
  setSearchQuery,
  onAdd,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onAdd: (tag: string) => void;
}) {
  const [tagCount, setTagCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setTagCount(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const [vRes, wRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).contains("values", [trimmed]),
          supabase.from("profiles").select("id", { count: "exact", head: true }).contains("worries", [trimmed]),
        ]);
        setTagCount((vRes.count ?? 0) + (wRes.count ?? 0));
      } catch {
        setTagCount(null);
      }
      setIsLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 12px" }}>
        <span style={{ color: "#9ca3af" }}>🔍</span>
        <input
          type="text"
          placeholder="タグを検索・追加..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, outline: "none", fontSize: 14, color: "#111827", background: "transparent" }}
        />
        {searchQuery.trim() && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ color: "#9ca3af", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        )}
      </div>
      {searchQuery.trim() && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          {isLoading
            ? "検索中..."
            : tagCount !== null && tagCount > 0
              ? `「${searchQuery.trim()}」を追加中の人: ${tagCount}人`
              : null
          }
          <button
            onClick={() => { onAdd(searchQuery.trim()); setSearchQuery(""); }}
            style={{ marginLeft: 8, fontSize: 12, color: "#111827", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
          >
            + 追加
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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
  const [userName, setUserName] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("基本情報");
  const [workCategoryIdx, setWorkCategoryIdx] = useState(0);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTagsBySection, setCustomTagsBySection] = useState<Record<string, string[]>>({
    "ライフステージ": [],
    "価値観": [],
    "仕事・職種": [],
  });
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const participantId = localStorage.getItem(`participant_${inviteCode}`);
      if (!participantId) { setIsLoading(false); return; }
      try {
        const supabase = createClient();
        const [{ data: participant }, { data: prof }] = await Promise.all([
          supabase.from("participants").select("name").eq("id", participantId).single(),
          supabase.from("profiles").select("*").eq("participant_id", participantId).single(),
        ]);
        const allValues = prof?.values ?? [];
        const customValues = allValues.filter((v) => !VALUES_OPTIONS.includes(v));
        setCustomTagsBySection((prev) => ({ ...prev, 価値観: customValues }));
        setProfile({
          name: participant?.name ?? "",
          life_stage: prof?.life_stage ?? "",
          work_context: prof?.work_context ?? "",
          worries: prof?.worries ?? [],
          values: allValues.filter((v) => VALUES_OPTIONS.includes(v)),
        });
      } catch { /* keep defaults */ }
      setIsLoading(false);
    })();
  }, [inviteCode]);

  // Reset search when section changes
  useEffect(() => { setSearchQuery(""); }, [activeSection]);

  const addCustomTag = (section: string, tag: string) => {
    setCustomTagsBySection((prev) => ({
      ...prev,
      [section]: prev[section]?.includes(tag) ? prev[section] : [...(prev[section] ?? []), tag],
    }));
  };

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

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const saveSection = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const participantId = localStorage.getItem(`participant_${inviteCode}`);
    if (!participantId) { setIsSaving(false); return; }
    try {
      const supabase = createClient();
      if (activeSection === "基本情報") {
        await supabase.from("participants").update({ name: profile.name }).eq("id", participantId);
      } else if (activeSection === "ライフステージ") {
        await supabase.from("profiles").upsert({ participant_id: participantId, life_stage: profile.life_stage || null });
      } else if (activeSection === "仕事・職種") {
        await supabase.from("profiles").upsert({ participant_id: participantId, work_context: profile.work_context || null });
      } else if (activeSection === "価値観") {
        const merged = [...profile.values, ...(customTagsBySection["価値観"] ?? [])];
        await supabase.from("profiles").upsert({ participant_id: participantId, values: merged.length ? merged : null });
      }
    } catch { /* ignore */ }
    setIsSaving(false);
    flash();
  };

  const handleLogout = () => {
    localStorage.removeItem(`participant_${inviteCode}`);
    router.push("/");
  };

  // ─── Section content ──────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading) return <p className="text-sm text-gray-400 text-center py-8">読み込み中...</p>;

    switch (activeSection) {
      // ── 基本情報 ──
      case "基本情報":
        return (
          <div className="flex flex-col gap-4 p-4">
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
            <div>
              <label className="text-xs font-medium text-gray-900 mb-1 block">ユーザーネーム</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-2.5 gap-1 focus-within:border-gray-900 transition-colors">
                <span className="text-sm text-gray-400">@</span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="username"
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
            </div>
            <SaveButton saved={saved} isSaving={isSaving} onClick={saveSection} />
          </div>
        );

      // ── ライフステージ ──
      case "ライフステージ": {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q ? LIFE_STAGES.filter((s) => s.toLowerCase().includes(q)) : LIFE_STAGES;
        const customInSection = customTagsBySection["ライフステージ"] ?? [];
        const filteredCustom = q ? customInSection.filter((s) => s.toLowerCase().includes(q)) : customInSection;
        return (
          <div className="flex flex-col">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAdd={(tag) => addCustomTag("ライフステージ", tag)}
            />
            {filtered.map((s) => {
              const selected = profile.life_stage === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, life_stage: p.life_stage === s ? "" : s }))}
                  className={`flex items-center justify-between px-4 border-b border-gray-100 transition-colors active:bg-gray-50 ${selected ? "bg-gray-50" : "bg-white"}`}
                  style={{ height: "48px" }}
                >
                  <span className="text-sm text-gray-900">{s}</span>
                  {selected && <Check size={16} className="text-gray-900 shrink-0" />}
                </button>
              );
            })}
            {filteredCustom.map((tag) => (
              <div key={tag} className="flex items-center justify-between px-4 border-b border-gray-100 bg-gray-50/50" style={{ height: "48px" }}>
                <span className="text-sm text-gray-700"># {tag}</span>
                <button
                  type="button"
                  onClick={() => setCustomTagsBySection((prev) => ({ ...prev, ライフステージ: (prev["ライフステージ"] ?? []).filter((t) => t !== tag) }))}
                  className="text-gray-400 active:opacity-60"
                >✕</button>
              </div>
            ))}
            <div className="p-4">
              <SaveButton saved={saved} isSaving={isSaving} onClick={saveSection} />
            </div>
          </div>
        );
      }

      // ── 仕事・職種 ──
      case "仕事・職種": {
        const q = searchQuery.trim().toLowerCase();
        const customInSection = customTagsBySection["仕事・職種"] ?? [];
        return (
          <div className="flex flex-col">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAdd={(tag) => addCustomTag("仕事・職種", tag)}
            />
            {/* Big category tabs */}
            <div
              className="px-4 py-3 border-b border-gray-100"
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
            {WORK_CATEGORIES[workCategoryIdx].jobs.map((job) => {
              const filteredDetails = q ? job.details.filter((d) => d.toLowerCase().includes(q)) : job.details;
              if (q && filteredDetails.length === 0) return null;
              return (
                <div key={job.label}>
                  <button
                    type="button"
                    onClick={() => setOpenJob(openJob === job.label ? null : job.label)}
                    className="w-full flex items-center justify-between px-4 border-b border-gray-100 bg-white active:bg-gray-50 transition-colors"
                    style={{ height: "48px" }}
                  >
                    <span className="text-sm text-gray-900">{job.label}</span>
                    {openJob === job.label
                      ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
                      : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                  </button>
                  {(openJob === job.label || q) && filteredDetails.map((detail) => {
                    const selected = selectedWorkDetails.includes(detail);
                    return (
                      <button
                        key={detail}
                        type="button"
                        onClick={() => toggleWorkDetail(detail)}
                        className={`w-full flex items-center justify-between pl-8 pr-4 border-b border-gray-100 transition-colors active:bg-gray-100 ${selected ? "bg-gray-50" : "bg-gray-50/60"}`}
                        style={{ height: "44px" }}
                      >
                        <span className="text-sm text-gray-700">{detail}</span>
                        {selected && <Check size={15} className="text-gray-900 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {customInSection.map((tag) => (
              <div key={tag} className="flex items-center justify-between px-4 border-b border-gray-100 bg-gray-50/50" style={{ height: "48px" }}>
                <span className="text-sm text-gray-700"># {tag}</span>
                <button
                  type="button"
                  onClick={() => setCustomTagsBySection((prev) => ({ ...prev, "仕事・職種": (prev["仕事・職種"] ?? []).filter((t) => t !== tag) }))}
                  className="text-gray-400 active:opacity-60"
                >✕</button>
              </div>
            ))}
            <div className="p-4">
              <SaveButton saved={saved} isSaving={isSaving} onClick={saveSection} />
            </div>
          </div>
        );
      }

      // ── 価値観 ──
      case "価値観": {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q ? VALUES_OPTIONS.filter((v) => v.toLowerCase().includes(q)) : VALUES_OPTIONS;
        const customInSection = customTagsBySection["価値観"] ?? [];
        const filteredCustom = q ? customInSection.filter((v) => v.toLowerCase().includes(q)) : customInSection;
        return (
          <div className="flex flex-col">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAdd={(tag) => addCustomTag("価値観", tag)}
            />
            {filtered.map((v) => {
              const selected = profile.values.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProfile((p) => ({
                    ...p,
                    values: p.values.includes(v) ? p.values.filter((x) => x !== v) : [...p.values, v],
                  }))}
                  className={`flex items-center justify-between px-4 border-b border-gray-100 transition-colors active:bg-gray-50 ${selected ? "bg-gray-50" : "bg-white"}`}
                  style={{ height: "48px" }}
                >
                  <span className="text-sm text-gray-900">{v}</span>
                  {selected && <Check size={16} className="text-gray-900 shrink-0" />}
                </button>
              );
            })}
            {filteredCustom.map((tag) => (
              <div key={tag} className="flex items-center justify-between px-4 border-b border-gray-100 bg-gray-50/50" style={{ height: "48px" }}>
                <span className="text-sm text-gray-700"># {tag}</span>
                <button
                  type="button"
                  onClick={() => setCustomTagsBySection((prev) => ({ ...prev, 価値観: (prev["価値観"] ?? []).filter((t) => t !== tag) }))}
                  className="text-gray-400 active:opacity-60"
                >✕</button>
              </div>
            ))}
            <div className="p-4">
              <SaveButton saved={saved} isSaving={isSaving} onClick={saveSection} />
            </div>
          </div>
        );
      }

      // ── アカウント ──
      case "アカウント":
        return (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-gray-900" />
                <span className="text-sm text-gray-900">プッシュ通知</span>
              </div>
              <Toggle checked={notifEnabled} onChange={setNotifEnabled} />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-red-500 font-medium">ログアウト</span>
            </button>
          </div>
        );
    }
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

      {/* Body: left nav + right content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left nav */}
        <div className="shrink-0 border-r border-gray-100 overflow-y-auto" style={{ width: "100px" }}>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveSection(s); setSaved(false); }}
              className={`w-full flex items-center justify-center text-center px-2 transition-colors ${
                activeSection === s
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 active:bg-gray-50"
              }`}
              style={{ height: "52px", fontSize: "11px", fontWeight: activeSection === s ? 700 : 500, lineHeight: 1.3 }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </main>
  );
}
