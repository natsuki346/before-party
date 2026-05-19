"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getConnectionCount } from "@/lib/supabase/likes";

type HistoryEntry = {
  participantId: string;
  eventId: string;
  joinedAt: string;
  title: string;
  eventDate: string;
  inviteCode: string;
  connectionCount: number;
};

export default function HistoryPage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
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

        // 1. 自分の名前を取得
        const { data: self } = await supabase
          .from("participants")
          .select("name")
          .eq("id", participantId)
          .single();

        if (!self?.name) {
          setIsLoading(false);
          return;
        }

        // 2. 同じ名前の全参加者レコードをイベント情報付きで取得
        const { data: records } = await supabase
          .from("participants")
          .select("id, event_id, created_at, events(id, title, event_date, invite_code)")
          .eq("name", self.name)
          .order("created_at", { ascending: false });

        if (!records || records.length === 0) {
          setIsLoading(false);
          return;
        }

        // 3. 各イベントのつながり数を並列取得
        const resolved = await Promise.all(
          records.map(async (r) => {
            const ev = Array.isArray(r.events) ? r.events[0] : r.events;
            if (!ev) return null;
            const count = await getConnectionCount(r.id, r.event_id);
            return {
              participantId: r.id,
              eventId: r.event_id,
              joinedAt: r.created_at,
              title: ev.title,
              eventDate: ev.event_date,
              inviteCode: ev.invite_code,
              connectionCount: count,
            } satisfies HistoryEntry;
          })
        );

        setEntries(resolved.filter((e): e is HistoryEntry => e !== null));
      } catch {
        // keep empty on error
      }
      setIsLoading(false);
    })();
  }, [inviteCode]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
          aria-label="戻る"
        >
          <ArrowLeft size={18} className="text-gray-900" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">参加履歴</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">読み込み中...</p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-sm font-semibold text-gray-700">まだ参加履歴がありません</p>
            <p className="text-xs text-gray-400">イベントに参加するとここに表示されます</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 px-4 py-4">
            {entries.map((entry) => (
              <Link
                key={entry.participantId}
                href={`/e/${entry.inviteCode}/members`}
                className="flex flex-col gap-2.5 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 active:bg-gray-50 transition-colors mb-3"
              >
                {/* Event title */}
                <h2 className="text-sm font-bold text-gray-900 leading-snug">
                  {entry.title}
                </h2>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={13} className="shrink-0" />
                  <span>{formatDate(entry.eventDate)}</span>
                </div>

                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                  {/* Connection count */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users size={13} className="shrink-0" />
                    <span>
                      {entry.connectionCount > 0
                        ? `${entry.connectionCount}人とつながり`
                        : "つながりなし"}
                    </span>
                  </div>

                  {/* Invite code badge */}
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {entry.inviteCode}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
