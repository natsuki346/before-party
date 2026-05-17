"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { Event, ParticipantWithProfile } from "@/lib/supabase/types";
import RoomSelection from "./RoomSelection";

function getMatchColor(score: number, index: number, total: number): string {
  const rank = score > 0 ? score : Math.max(0, total - index) * 10;
  if (rank >= 50) return "#ef4444";
  if (rank >= 35) return "#f97316";
  if (rank >= 20) return "#eab308";
  if (rank >= 10) return "#3b82f6";
  return "#6366f1";
}

function getMatchBg(score: number, index: number, total: number): string {
  const rank = score > 0 ? score : Math.max(0, total - index) * 10;
  if (rank >= 50) return "rgba(239, 68, 68, 0.06)";
  if (rank >= 35) return "rgba(249, 115, 22, 0.06)";
  if (rank >= 20) return "rgba(234, 179, 8, 0.06)";
  if (rank >= 10) return "rgba(59, 130, 246, 0.06)";
  return "rgba(99, 102, 241, 0.06)";
}

function calcScore(mine: ParticipantWithProfile, other: ParticipantWithProfile): number {
  const mp = mine.profiles;
  const op = other.profiles;
  if (!mp || !op) return 0;
  let score = 0;
  if (mp.life_stage && mp.life_stage === op.life_stage) score += 20;
  const sharedWorries = (mp.worries ?? []).filter((w) => (op.worries ?? []).includes(w)).length;
  score += sharedWorries * 15;
  const sharedValues = (mp.values ?? []).filter((v) => (op.values ?? []).includes(v)).length;
  score += sharedValues * 15;
  return score;
}

type CardData = ParticipantWithProfile & { score: number };

const SWIPE_THRESHOLD = 80;

const DEMO_EVENTS = [
  { invite_code: "test-event", title: "テストイベント" },
  { invite_code: "ai-meetup",  title: "AI勉強会"       },
  { invite_code: "startup-lt", title: "起業家LT会"     },
];

// Layout — max-width:390px, margin:0 auto, height:100dvh
//   header    = shrink-0, h-11 (44px)
//   card area = flex-1 min-h-0  →  card: position:absolute, 90%×95%, left:5% top:2.5%
//   buttons   = shrink-0, h-[80px]
//   nav gap   = shrink-0, h-[60px]  (clears fixed bottom nav)

export default function MembersList({
  event,
  participants,
  inviteCode,
}: {
  event: Event;
  participants: ParticipantWithProfile[];
  inviteCode: string;
}) {
  const [myId, setMyId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState<"rooms" | "tinder">("rooms");
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);
  const [eventIdx, setEventIdx] = useState(() => {
    const i = DEMO_EVENTS.findIndex((e) => e.invite_code === inviteCode);
    return i >= 0 ? i : 0;
  });

  const startX = useRef(0);
  const headerStartX = useRef(0);

  useEffect(() => {
    const id = localStorage.getItem(`participant_${inviteCode}`);
    setMyId(id);
    setIsLoaded(true);
  }, [inviteCode]);

  // Keyboard: right arrow = LIKE, left arrow = SKIP
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") swipe("right");
      else if (e.key === "ArrowLeft") swipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (!isLoaded) return;
    const me = participants.find((p) => p.id === myId);
    const others = participants.filter((p) => p.id !== myId);
    const ranked = others
      .map((p) => ({ ...p, score: me ? calcScore(me, p) : 0 }))
      .sort((a, b) => b.score - a.score);
    setCards(ranked);
    setIndex(0);
  }, [myId, participants, isLoaded]);

  const swipe = (dir: "left" | "right") => {
    if (flyOut !== null || index >= cards.length) return;
    setFlyOut(dir);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setFlyOut(null);
      setDragX(0);
    }, 320);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || flyOut !== null) return;
    setDragX(e.touches[0].clientX - startX.current);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      swipe(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
    }
  };

  if (!isLoaded) return null;

  const me = participants.find((p) => p.id === myId);
  const myInitial = me?.name?.[0] ?? "?";

  // Show room selection first; switch to tinder after "この部屋に入る"
  if (view === "rooms") {
    return <RoomSelection onEnter={() => setView("tinder")} myInitial={myInitial} inviteCode={inviteCode} />;
  }

  const card = cards[index];
  const nextCard = cards[index + 1];

  const containerStyle: React.CSSProperties = {
    maxWidth: "390px",
    margin: "0 auto",
    height: "100dvh",
    overflow: "hidden",
    background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e3 100%)",
  };

  const emptyScreen = (icon: string, title: string, body: string) => (
    <main
      className="flex flex-col items-center justify-center px-8 text-center bg-gray-50 overflow-hidden"
      style={containerStyle}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-base font-bold mb-1">{title}</h2>
      <p className="text-xs text-gray-500">{body}</p>
    </main>
  );

  if (cards.length === 0)
    return emptyScreen("👀", "まだ参加者がいません", "他の参加者が登録すると表示されます。");
  if (!card)
    return emptyScreen("🎉", "全員チェック済み！", "全員のプロフィールを確認しました。");

  const matchColor = getMatchColor(card.score, index, cards.length);

  const translateX = flyOut ? (flyOut === "right" ? 350 : -350) : dragX;
  const rotate = flyOut ? (flyOut === "right" ? 15 : -15) : dragX * 0.04;

  const swipeTransform = `translateX(${translateX}px) rotate(${rotate}deg)`;
  const swipeTransition = flyOut
    ? "transform 0.25s ease-out"
    : isDragging
      ? "none"
      : "transform 0.2s ease-out";

  const likeOpacity = flyOut === "right" ? 1 : Math.min(1, Math.max(0, (dragX - 20) / SWIPE_THRESHOLD));
  const skipOpacity = flyOut === "left" ? 1 : Math.min(1, Math.max(0, (-dragX - 20) / SWIPE_THRESHOLD));

  // Card position: centered via left:5% top:2.5% (= (100%-90%)/2, (100%-95%)/2)
  const cardBase: React.CSSProperties = {
    position: "absolute",
    width: "90%",
    height: "95%",
    left: "5%",
    top: "2.5%",
  };

  return (
    <main
      className="flex flex-col overflow-hidden"
      style={containerStyle}
    >
      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3">
        {/* Left: back to room selection */}
        <button
          onClick={() => { setView("rooms"); setIndex(0); }}
          className="shrink-0 flex items-center gap-0.5 text-gray-600 active:opacity-60 transition-opacity"
        >
          <ArrowLeft size={17} />
          <span className="text-xs font-medium">戻る</span>
        </button>

        {/* Center: swipeable event name */}
        <div
          className="flex-1 flex items-center justify-center gap-1 min-w-0 cursor-default"
          onTouchStart={(e) => { headerStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - headerStartX.current;
            if (dx < -40 && eventIdx < DEMO_EVENTS.length - 1) setEventIdx((i) => i + 1);
            if (dx >  40 && eventIdx > 0)                      setEventIdx((i) => i - 1);
          }}
        >
          <ChevronLeft
            size={14}
            className={eventIdx > 0 ? "text-gray-400 shrink-0" : "text-gray-200 shrink-0"}
          />
          <h1 className="text-sm font-bold text-gray-800 truncate text-center">
            {DEMO_EVENTS[eventIdx].title}
          </h1>
          <ChevronRight
            size={14}
            className={eventIdx < DEMO_EVENTS.length - 1 ? "text-gray-400 shrink-0" : "text-gray-200 shrink-0"}
          />
        </div>

        {/* Right: bell + chat icons with badges */}
        <div className="flex items-center shrink-0">
          <button className="relative p-1.5">
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
              1
            </span>
          </button>
          <Link href={`/e/${inviteCode}/chats`} className="relative p-1.5">
            <MessageCircle size={20} className="text-gray-700" />
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
              2
            </span>
          </Link>
        </div>
      </div>

      {/* Card area — flex-1, cards are absolutely positioned within */}
      <div className="flex-1 min-h-0 relative overflow-hidden">

        {/* Next card (skeleton, behind) */}
        {nextCard && (
          <div
            className="pointer-events-none"
            style={{
              ...cardBase,
              transform: "scale(0.95) translateY(6px)",
              zIndex: 0,
            }}
          >
            <div className="w-full h-full rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div className="h-6 bg-gray-100 rounded-full mb-3 w-2/5" />
              <div className="h-3 bg-gray-100 rounded-full mb-2 w-full" />
              <div className="h-3 bg-gray-100 rounded-full w-3/5" />
            </div>
          </div>
        )}

        {/* Current card */}
        <div
          className="select-none"
          style={{
            ...cardBase,
            transform: swipeTransform,
            transition: swipeTransition,
            touchAction: "none",
            zIndex: 1,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={(e) => { startX.current = e.clientX; setIsDragging(true); }}
          onMouseMove={(e) => { if (!isDragging || flyOut !== null) return; setDragX(e.clientX - startX.current); }}
          onMouseUp={() => { setIsDragging(false); if (Math.abs(dragX) >= SWIPE_THRESHOLD) swipe(dragX > 0 ? "right" : "left"); else setDragX(0); }}
          onMouseLeave={() => { if (!isDragging) return; setIsDragging(false); if (Math.abs(dragX) >= SWIPE_THRESHOLD) swipe(dragX > 0 ? "right" : "left"); else setDragX(0); }}
        >
          <div className="w-full h-full overflow-hidden" style={{ position: "relative", background: `linear-gradient(160deg, ${matchColor}22 0%, ${matchColor}08 100%)`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "28px", borderTop: `2px solid ${matchColor}66`, borderRight: `1px solid ${matchColor}33`, borderBottom: `1px solid ${matchColor}22`, borderLeft: `4px solid ${matchColor}`, boxShadow: `0 2px 0 rgba(255,255,255,0.9) inset, 0 20px 40px ${matchColor}20, 0 4px 16px ${matchColor}15` }}>

            {/* Gloss highlight */}
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: "35%", background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)", borderRadius: "0 0 50% 50%", pointerEvents: "none", zIndex: 2 }} />

            {/* LIKE overlay */}
            <div
              className="absolute inset-0 bg-green-400/20 z-10 flex items-start justify-start p-4 rounded-2xl pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-500 font-black text-2xl border-[3px] border-green-500 px-2.5 py-0.5 rounded-lg -rotate-12 tracking-wider">
                LIKE
              </span>
            </div>

            {/* SKIP overlay */}
            <div
              className="absolute inset-0 bg-red-400/20 z-10 flex items-start justify-end p-4 rounded-2xl pointer-events-none"
              style={{ opacity: skipOpacity }}
            >
              <span className="text-red-500 font-black text-2xl border-[3px] border-red-500 px-2.5 py-0.5 rounded-lg rotate-12 tracking-wider">
                SKIP
              </span>
            </div>

            {/* Content: event info → match score → name → life stage → work context → values → worries */}
            <div className="p-5 flex flex-col gap-3 h-full overflow-hidden">

              {/* Event info */}
              <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <span>{event.title}</span>
                <span>·</span>
                <span>
                  {new Date(event.event_date).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                </span>
              </div>

              {/* Match score — dummy 85% */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500 font-medium">マッチ度</span>
                  <span className="text-[11px] font-bold" style={{ color: matchColor }}>85%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: "85%", background: `linear-gradient(90deg, ${matchColor}, ${matchColor}aa)`, boxShadow: `0 0 8px ${matchColor}66`, borderRadius: "4px" }} />
                </div>
              </div>

              {/* 1. 名前 */}
              <div>
                <h2 className="text-2xl font-bold leading-tight" style={{ color: "rgba(0,0,0,0.85)" }}>
                  {card.name}
                </h2>
              </div>

              {/* 2. ライフステージタグ */}
              <div className="flex flex-wrap gap-1.5">
                {card.profiles?.life_stage && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {card.profiles.life_stage}
                  </span>
                )}
                {card.score > 0 && (
                  <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                    マッチ度 {card.score}
                  </span>
                )}
              </div>

              {/* divider */}
              <div className="border-t border-gray-100" />

              {/* 3. 仕事文脈 */}
              {card.profiles?.work_context && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {card.profiles.work_context}
                </p>
              )}

              {/* 4. 価値観タグ */}
              {card.profiles?.values && card.profiles.values.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    価値観
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.profiles.values.map((v) => (
                      <span
                        key={v}
                        className="text-xs border border-gray-200 px-2.5 py-1 rounded-full text-gray-600"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 悩みタグ */}
              {card.profiles?.worries && card.profiles.worries.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    悩み
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.profiles.worries.map((w) => (
                      <span
                        key={w}
                        className="text-xs border border-orange-200 bg-orange-50 px-2.5 py-1 rounded-full text-orange-600"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Button area — 80px for buttons + 60px spacer for fixed bottom nav */}
      <div className="shrink-0 h-[80px] flex items-center justify-center gap-10">
        <button
          onClick={() => swipe("left")}
          disabled={flyOut !== null}
          className="w-14 h-14 rounded-full border-2 border-red-300 bg-white flex items-center justify-center text-xl shadow-md active:scale-90 transition-transform disabled:opacity-40"
          aria-label="スキップ"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("right")}
          disabled={flyOut !== null}
          className="w-14 h-14 rounded-full border-2 border-green-300 bg-white flex items-center justify-center text-xl shadow-md active:scale-90 transition-transform disabled:opacity-40"
          aria-label="気になる"
        >
          ❤️
        </button>
      </div>

      {/* 60px spacer — clears the fixed bottom nav */}
      <div className="shrink-0 h-[60px]" />
    </main>
  );
}
