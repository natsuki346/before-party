"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, Menu, MessageCircle } from "lucide-react";
import { useSidebar } from "../SidebarContext";

const ROOMS = [
  { invite_code: "test-event", title: "テストイベント", count: 4  },
  { invite_code: "ai-meetup",  title: "AI勉強会",       count: 8  },
  { invite_code: "startup-lt", title: "起業家LT会",     count: 12 },
];

// Door width = 55% of 390px ≈ 215px
const CARD_W    = 215;
const GAP       = 18;
const SIDE      = (390 - CARD_W) / 2; // ~87px visible on each side
const STEP      = CARD_W + GAP;
const THRESHOLD = 50;
const FRAME_PAD = 5;

// ─── Single door ──────────────────────────────────────────────────────────────
function HallwayDoor({
  title,
  count,
  isActive,
  isOpening,
}: {
  title: string;
  count: number;
  isActive: boolean;
  isOpening: boolean;
}) {
  const glow = isActive
    ? "0 0 24px #f5c842, 0 0 60px rgba(245,200,66,0.25), 0 8px 32px rgba(0,0,0,0.6)"
    : "0 4px 16px rgba(0,0,0,0.5)";

  return (
    <div
      style={{
        width: CARD_W,
        flexShrink: 0,
        opacity: isActive ? 1 : 0.35,
        transform: isActive ? "scale(1)" : "scale(0.88)",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      {/* Frame */}
      <div
        style={{
          width: CARD_W,
          height: "50dvh",
          backgroundColor: "#2a1000",
          borderRadius: "10px 10px 0 0",
          position: "relative",
          boxShadow: glow,
          transition: "box-shadow 0.3s",
        }}
      >
        {/* Door panel — simple dark brown rectangle */}
        <div
          style={{
            position: "absolute",
            top: FRAME_PAD, right: FRAME_PAD, bottom: 0, left: FRAME_PAD,
            borderRadius: "5px 5px 0 0",
            background: "#3d1f00",
            overflow: "hidden",
          }}
        >
          {/* Bright interior — revealed as panels open */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 40%, #fff8e8 0%, #ffffff 70%)",
              opacity: isActive && isOpening ? 1 : 0,
              transition: isOpening ? "opacity 0.35s ease 0.25s" : "none",
              zIndex: 1,
            }}
          />

          {/* Content (fades out when opening) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: isActive && isOpening ? 0 : 1,
              transition: isOpening ? "opacity 0.15s ease" : "none",
              zIndex: 2,
            }}
          >
            {/* Event name — large, centered, white */}
            <p
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: "20px",
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 1.35,
                padding: "0 20px",
              }}
            >
              {title}
            </p>

            {/* Doorknob — gold circle, right side slightly below center */}
            <div
              style={{
                position: "absolute",
                right: "13px",
                top: "60%",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#d4a017",
                boxShadow: isActive
                  ? "0 0 8px rgba(212,160,23,0.8), 0 1px 3px rgba(0,0,0,0.5)"
                  : "0 1px 3px rgba(0,0,0,0.4)",
              }}
            />

            {/* Count — bottom */}
            <p
              style={{
                position: "absolute",
                bottom: "14px",
                left: 0,
                right: 0,
                textAlign: "center",
                color: `rgba(255,255,255,${isActive ? 0.8 : 0.4})`,
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.04em",
              }}
            >
              {count}人が待っています
            </p>
          </div>

          {/* Left panel — only rendered during opening animation */}
          {isActive && isOpening && (
            <div
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "50%", height: "100%",
                backgroundColor: "#3d1f00",
                transformOrigin: "left center",
                transform: "perspective(500px) rotateY(-80deg)",
                transition: "transform 0.4s ease-in",
                zIndex: 10,
              }}
            />
          )}

          {/* Right panel — only rendered during opening animation */}
          {isActive && isOpening && (
            <div
              style={{
                position: "absolute",
                top: 0, right: 0,
                width: "50%", height: "100%",
                backgroundColor: "#3d1f00",
                transformOrigin: "right center",
                transform: "perspective(500px) rotateY(80deg)",
                transition: "transform 0.4s ease-in",
                zIndex: 10,
              }}
            />
          )}
        </div>
      </div>

      {/* Doorstep */}
      <div
        style={{
          width: CARD_W + 12,
          height: "8px",
          backgroundColor: "#1a0d00",
          marginLeft: "-6px",
          borderRadius: "0 0 4px 4px",
          boxShadow: isActive
            ? "0 4px 12px rgba(245,200,66,0.15), 0 4px 8px rgba(0,0,0,0.6)"
            : "0 4px 8px rgba(0,0,0,0.5)",
          transition: "box-shadow 0.3s",
        }}
      />
    </div>
  );
}

// ─── Room Selection Carousel ───────────────────────────────────────────────────
export default function RoomSelection({
  onEnter,
  myInitial,
  inviteCode,
}: {
  onEnter: () => void;
  myInitial: string;
  inviteCode: string;
}) {
  const { openSidebar } = useSidebar();
  const [roomIdx, setRoomIdx]       = useState(0);
  const [dragX, setDragX]           = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpening, setIsOpening]   = useState(false);
  const [showWhite, setShowWhite]   = useState(false);
  const startX = useRef(0);

  const translateX = -(roomIdx * STEP) + dragX;

  const onTouchStart = (e: React.TouchEvent) => {
    if (isOpening) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isOpening) return;
    setDragX(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (dragX < -THRESHOLD && roomIdx < ROOMS.length - 1) setRoomIdx((i) => i + 1);
    else if (dragX > THRESHOLD && roomIdx > 0)            setRoomIdx((i) => i - 1);
    setDragX(0);
  };

  const handleEnter = () => {
    if (isOpening) return;
    setIsOpening(true);                          // 1. panels start opening (0.4s)
    setTimeout(() => setShowWhite(true), 350);   // 2. white fade-in starts (0.35s)
    setTimeout(() => onEnter(), 720);            // 3. switch to tinder
  };

  return (
    <main
      className="flex flex-col overflow-hidden select-none"
      style={{
        maxWidth: "390px",
        margin: "0 auto",
        height: "100dvh",
        backgroundColor: "#ffffff",
        position: "relative",
      }}
    >
      {/* Sidebar trigger button */}
      <button
        onClick={openSidebar}
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.75)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 25,
          backdropFilter: "blur(4px)",
        }}
        aria-label="メニューを開く"
      >
        <Menu size={18} />
      </button>

      {/* Header */}
      <div className="shrink-0 h-12 flex items-center gap-2 px-3 border-b border-gray-100">
        {/* Left: avatar → settings */}
        <Link href={`/e/${inviteCode}/settings`} className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {myInitial}
          </div>
        </Link>

        {/* Center: label */}
        <span className="flex-1 text-center text-sm font-bold text-gray-800">
          部屋を選んで入室
        </span>

        {/* Right: bell + chat */}
        <div className="flex items-center shrink-0">
          <button className="relative p-1.5">
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
              2
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

      {/* White flash overlay — opacity-0 by default, fades to 1 on open */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "white",
          zIndex: 100,
          opacity: showWhite ? 1 : 0,
          transition: showWhite ? "opacity 0.35s ease" : "none",
          pointerEvents: showWhite ? "all" : "none",
        }}
      />

      {/* Header */}


      {/* Carousel */}
      <div
        className="flex-1 flex items-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "flex",
            gap: GAP,
            paddingLeft: SIDE,
            paddingRight: SIDE,
            transform: `translateX(${translateX}px)`,
            transition: isDragging
              ? "none"
              : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
            willChange: "transform",
            alignItems: "center",
          }}
        >
          {ROOMS.map((room, i) => (
            <HallwayDoor
              key={room.invite_code}
              title={room.title}
              count={room.count}
              isActive={i === roomIdx}
              isOpening={isOpening}
            />
          ))}
        </div>
      </div>

      {/* Bottom — dots + button + nav spacer */}
      <div className="shrink-0 flex flex-col items-center">
        {/* Dot indicator */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {ROOMS.map((_, i) => (
            <button
              key={i}
              onClick={() => !isOpening && setRoomIdx(i)}
              style={{
                width: i === roomIdx ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor:
                  i === roomIdx ? "#1a1008" : "rgba(0,0,0,0.15)",
                transition: "all 0.25s",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Enter button */}
        <div
          style={{ width: "100%", paddingLeft: "20px", paddingRight: "20px", marginBottom: "12px" }}
        >
          <button
            onClick={handleEnter}
            disabled={isOpening}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "16px",
              backgroundColor: "#f5c842",
              color: "#1a1008",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.04em",
              border: "none",
              cursor: isOpening ? "default" : "pointer",
              boxShadow: "0 0 20px rgba(245,200,66,0.35)",
              opacity: isOpening ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            この部屋に入る
          </button>
        </div>

        {/* Bottom nav clearance */}
        <div style={{ height: "60px" }} />
      </div>
    </main>
  );
}
