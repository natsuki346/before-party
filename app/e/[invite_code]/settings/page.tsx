"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileData = {
  name: string;
  life_stage: string;
  work_context: string;
  worries: string[];
  values: string[];
};

export default function SettingsPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [profile, setProfile] = useState<ProfileData | null>(null);
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
        setProfile({ name: "", life_stage: "", work_context: "", worries: [], values: [] });
      }
      setIsLoading(false);
    })();
  }, [inviteCode]);

  return (
    <main
      className="flex flex-col bg-white"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        <Link
          href={`/e/${inviteCode}/members`}
          className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <h1 className="flex-1 text-sm font-bold text-gray-900">プロフィール</h1>
        <Link
          href={`/e/${inviteCode}/settings/edit`}
          className="px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-50 transition-colors"
        >
          編集
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">読み込み中...</p>
        ) : profile === null ? (
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center gap-3">
            <p className="text-sm text-gray-500">プロフィールがまだ登録されていません</p>
            <Link
              href={`/e/${inviteCode}/settings/edit`}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
            >
              プロフィールを登録する
            </Link>
          </div>
        ) : (
          <>
            {/* Cover image */}
            <div
              style={{
                height: "100px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                flexShrink: 0,
              }}
            />

            {/* Avatar */}
            <div className="px-4">
              <div
                className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold border-4 border-white"
                style={{ marginTop: "-32px" }}
              >
                {profile.name?.[0] ?? "?"}
              </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pt-3 pb-8 flex flex-col gap-5">
              {/* Name */}
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {profile.name || "—"}
              </h2>

              {/* work_context */}
              {profile.work_context && (
                <p className="text-sm text-gray-600 leading-relaxed -mt-2">
                  {profile.work_context}
                </p>
              )}

              <div className="border-t border-gray-100" />

              {/* life_stage */}
              {profile.life_stage && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    ライフステージ
                  </p>
                  <div>
                    <span className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600">
                      {profile.life_stage}
                    </span>
                  </div>
                </div>
              )}

              {/* worries */}
              {profile.worries.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    最近の悩み
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.worries.map((w) => (
                      <span
                        key={w}
                        className="px-3 py-1.5 rounded-full text-xs bg-orange-100 text-orange-700 border border-orange-200"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* values */}
              {profile.values.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    大切にしていること
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.values.map((v) => (
                      <span
                        key={v}
                        className="px-3 py-1.5 rounded-full text-xs bg-gray-900 text-white"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
