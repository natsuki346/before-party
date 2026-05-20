"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EventItem = {
  inviteCode: string;
  title: string;
  date: string;
  participantCount: number;
};

const SWIPE_THRESH = 50;

type Role = "main" | "prev" | "next" | "hidden-above" | "hidden-below";

function getRoleStyle(role: Role): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", transition: "all 0.45s ease" };
  switch (role) {
    case "main":
      return { ...base, left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 180, height: 260, opacity: 1, zIndex: 10 };
    case "prev":
      return { ...base, left: "5%", top: "8%", transform: "translate(0, 0)", width: 90, height: 130, opacity: 0.45, zIndex: 5 };
    case "next":
      return { ...base, left: "5%", top: "calc(88% - 130px)", transform: "translate(0, 0)", width: 90, height: 130, opacity: 0.45, zIndex: 5 };
    case "hidden-above":
      return { ...base, left: "5%", top: "-28%", transform: "translate(0, 0)", width: 90, height: 130, opacity: 0, zIndex: 1, pointerEvents: "none" };
    case "hidden-below":
      return { ...base, left: "5%", top: "calc(118% - 130px)", transform: "translate(0, 0)", width: 90, height: 130, opacity: 0, zIndex: 1, pointerEvents: "none" };
  }
}

function getRole(i: number, activeIdx: number, N: number): Role {
  let diff = ((i - activeIdx) % N + N) % N;
  if (diff > N / 2) diff -= N;
  if (diff === 0)  return "main";
  if (diff === -1) return "prev";
  if (diff === 1)  return "next";
  return diff < 0 ? "hidden-above" : "hidden-below";
}

function Door({ event, isMain }: { event: EventItem; isMain: boolean }) {
  const sz = {
    name:  isMain ? "16px" : "10px",
    date:  isMain ? "10px" : "7.5px",
    count: isMain ? "11px" : "8px",
    knob:  isMain ? 12 : 7,
    knobR: isMain ? "8px" : "5px",
    padX:  isMain ? "14px" : "8px",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#3d1f00",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "0 0 15px rgba(212,160,23,0.4)",
      }}
    >
      {/* Top half — event name */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `8px ${sz.padX} 4px`,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.93)", fontSize: sz.name, fontWeight: "700", textAlign: "center", lineHeight: 1.3 }}>
          {event.title}
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
          gap: isMain ? "5px" : "2px",
          paddingLeft: sz.padX,
          paddingRight: `calc(${sz.knob}px + ${sz.knobR} + 4px)`,
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: sz.date, textAlign: "center" }}>
          {event.date}
        </p>
        <p style={{ color: "#d4a017", fontSize: sz.count, fontWeight: "600" }}>
          {event.participantCount}人が待っています
        </p>
      </div>

      {/* Doorknob */}
      <div
        style={{
          position: "absolute",
          right: sz.knobR,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${sz.knob}px`,
          height: `${sz.knob}px`,
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [index, setIndex] = useState(0);

  const touchStartY = useRef(0);
  const mouseStartY = useRef(0);
  const isMouseDown = useRef(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      const { data: rawEvents } = await supabase
        .from("events")
        .select("id, invite_code, title, event_date")
        .order("event_date", { ascending: true });

      if (!rawEvents || rawEvents.length === 0) return;

      // Batch-fetch all participant records and count client-side
      const { data: allParticipants } = await supabase
        .from("participants")
        .select("event_id")
        .in("event_id", rawEvents.map((e) => e.id));

      const countMap: Record<string, number> = {};
      for (const p of allParticipants ?? []) {
        countMap[p.event_id] = (countMap[p.event_id] ?? 0) + 1;
      }

      const items: EventItem[] = rawEvents.map((e) => ({
        inviteCode: e.invite_code,
        title: e.title,
        date: new Date(e.event_date).toLocaleDateString("ja-JP", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        participantCount: countMap[e.id] ?? 0,
      }));

      setEvents(items);

      const currentIdx = items.findIndex((e) => e.inviteCode === currentInviteCode);
      setIndex(Math.max(0, currentIdx));
    })();
  }, [currentInviteCode]);

  const N = events.length;

  // Touch
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const d = e.changedTouches[0].clientY - touchStartY.current;
    if      (d < -SWIPE_THRESH) setIndex((i) => (i + 1) % N);
    else if (d >  SWIPE_THRESH) setIndex((i) => (i - 1 + N) % N);
  };

  // Mouse (PC)
  const onMouseDown  = (e: React.MouseEvent) => { isMouseDown.current = true; mouseStartY.current = e.clientY; };
  const onMouseUp    = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const d = e.clientY - mouseStartY.current;
    if      (d < -SWIPE_THRESH) setIndex((i) => (i + 1) % N);
    else if (d >  SWIPE_THRESH) setIndex((i) => (i - 1 + N) % N);
  };
  const onMouseLeave = () => { isMouseDown.current = false; };

  const handleClick = (event: EventItem, role: Role) => {
    if (role === "main") {
      router.push(`/e/${event.inviteCode}/rooms/channels`);
    } else if (role === "prev") {
      setIndex((i) => (i - 1 + N) % N);
    } else if (role === "next") {
      setIndex((i) => (i + 1) % N);
    }
  };

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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {events.map((event, i) => {
        const role = getRole(i, index, N);
        return (
          <div
            key={event.inviteCode}
            style={{
              ...getRoleStyle(role),
              cursor: role === "main" || role === "prev" || role === "next" ? "pointer" : "default",
            }}
            onClick={() => handleClick(event, role)}
          >
            <Door event={event} isMain={role === "main"} />
          </div>
        );
      })}

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
        スワイプで切り替え・タップして入る
      </p>
    </main>
  );
}
