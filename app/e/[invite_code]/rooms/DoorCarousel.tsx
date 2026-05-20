"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EventData = {
  title: string;
  date: string;
  participantCount: number;
};

function Door({ data, onClick }: { data: EventData | null; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 180,
        height: 260,
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#3d1f00",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 15px rgba(212,160,23,0.4)",
        cursor: "pointer",
      }}
    >
      {/* Top half — event name */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 14px 4px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.93)",
            fontSize: "16px",
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {data?.title ?? "読み込み中..."}
        </p>
      </div>

      {/* Bottom half — date + count */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          paddingLeft: "14px",
          paddingRight: "calc(12px + 8px + 4px)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textAlign: "center" }}>
          {data?.date ?? ""}
        </p>
        {data && (
          <p style={{ color: "#d4a017", fontSize: "11px", fontWeight: "600" }}>
            {data.participantCount}人が待っています
          </p>
        )}
      </div>

      {/* Doorknob */}
      <div
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "#d4a017",
          boxShadow: "0 1px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3)",
        }}
      />
    </div>
  );
}

export default function DoorCarousel({ currentInviteCode }: { currentInviteCode: string }) {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      const { data: event } = await supabase
        .from("events")
        .select("id, title, event_date")
        .eq("invite_code", currentInviteCode)
        .single();

      if (!event) return;

      const { count } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);

      const date = new Date(event.event_date).toLocaleDateString("ja-JP", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setEventData({
        title: event.title,
        date,
        participantCount: count ?? 0,
      });
    })();
  }, [currentInviteCode]);

  return (
    <main
      className="select-none"
      style={{
        maxWidth: "390px",
        margin: "0 auto",
        height: "calc(100dvh - 60px)",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f5f0eb",
      }}
    >
      <Door
        data={eventData}
        onClick={() => router.push(`/e/${currentInviteCode}/rooms/channels`)}
      />

      <p
        style={{
          position: "absolute",
          bottom: "12px",
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#b0a090",
          fontSize: "11px",
          letterSpacing: "0.05em",
          zIndex: 25,
          pointerEvents: "none",
        }}
      >
        タップして入る
      </p>
    </main>
  );
}
