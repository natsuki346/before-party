"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/supabase/types";

// Door dimensions
const DOOR_W = 176;
const DOOR_H = 300;
const FRAME_PAD = 7;
const FRAME_W = DOOR_W + FRAME_PAD * 2;
const FRAME_H = DOOR_H + FRAME_PAD;

export default function DoorScene({
  event,
  inviteCode,
}: {
  event: Event;
  inviteCode: string;
}) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  const eventDate = new Date(event.event_date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleEnter = () => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => router.push(`/e/${inviteCode}/rooms/channels`), 680);
  };

  return (
    <main
      className="relative flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        maxWidth: "390px",
        margin: "0 auto",
        height: "calc(100dvh - 60px)",
        // Warm wall color
        backgroundColor: "#d6ccbf",
      }}
    >
      {/* Wall baseboard */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "36px",
          backgroundColor: "#c0b5a6",
          borderTop: "2px solid #b0a497",
        }}
      />

      {/* Door assembly */}
      <div style={{ position: "relative" }}>

        {/* Perspective wrapper — enables 3-D rotation */}
        <div style={{ perspective: "650px", perspectiveOrigin: "50% 50%" }}>

          {/* Door frame */}
          <div
            style={{
              width: FRAME_W,
              height: FRAME_H,
              backgroundColor: "#3e2710",
              borderRadius: "10px 10px 0 0",
              position: "relative",
              boxShadow:
                "4px 0 10px rgba(0,0,0,0.25), -4px 0 10px rgba(0,0,0,0.25), 0 -4px 10px rgba(0,0,0,0.15)",
            }}
          >
            {/* Room interior — revealed as door opens */}
            <div
              style={{
                position: "absolute",
                top: FRAME_PAD,
                right: FRAME_PAD,
                bottom: 0,
                left: FRAME_PAD,
                backgroundColor: "#f5ecd8",
                borderRadius: "4px 4px 0 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "28px", opacity: 0.7 }}>✨</span>
              <p style={{ fontSize: "11px", color: "#9a8878" }}>入室中…</p>
            </div>

            {/* Door panel */}
            <div
              onClick={handleEnter}
              style={{
                position: "absolute",
                top: FRAME_PAD,
                right: FRAME_PAD,
                bottom: 0,
                left: FRAME_PAD,
                // Wood grain gradient
                background:
                  "linear-gradient(175deg, #9a7250 0%, #8B6343 20%, #7d5535 45%, #8B6343 70%, #9a7250 100%)",
                borderRadius: "4px 4px 0 0",
                transformOrigin: "left center",
                transform: isOpening ? "rotateY(-82deg)" : "rotateY(0deg)",
                transition: "transform 0.62s cubic-bezier(0.4,0,1,1)",
                cursor: isOpening ? "default" : "pointer",
                zIndex: 10,
                boxShadow: isOpening
                  ? "-6px 0 14px rgba(0,0,0,0.3)"
                  : "inset 2px 0 5px rgba(255,255,255,0.08), inset -2px 0 5px rgba(0,0,0,0.12)",
              }}
            >
              {/* Small window at top */}
              <div
                style={{
                  margin: "14px auto 0",
                  width: "114px",
                  height: "36px",
                  backgroundColor: "rgba(255,225,140,0.18)",
                  border: "1.5px solid rgba(255,200,90,0.28)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.88)",
                    fontSize: "10px",
                    fontWeight: "700",
                    textAlign: "center",
                    lineHeight: 1.3,
                    padding: "0 6px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                  }}
                >
                  {event.title}
                </p>
              </div>

              {/* Upper decorative panel */}
              <div
                style={{
                  margin: "10px 12px 0",
                  height: "80px",
                  border: "1.5px solid rgba(0,0,0,0.13)",
                  borderRadius: "3px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
                }}
              />

              {/* Doorknob — right side, vertically centered */}
              <div
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "54%",
                  width: "13px",
                  height: "13px",
                  borderRadius: "50%",
                  backgroundColor: "#d4a843",
                  boxShadow:
                    "0 1px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.45)",
                }}
              />

              {/* Lower decorative panel */}
              <div
                style={{
                  margin: "10px 12px 0",
                  height: "88px",
                  border: "1.5px solid rgba(0,0,0,0.13)",
                  borderRadius: "3px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
                }}
              />

              {/* Date at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "9px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {eventDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Doorstep */}
        <div
          style={{
            width: FRAME_W + 12,
            height: "9px",
            backgroundColor: "#2a1508",
            marginLeft: "-6px",
            borderRadius: "0 0 4px 4px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
          }}
        />

        {/* Floor shadow */}
        <div
          style={{
            width: "140px",
            height: "18px",
            margin: "3px auto 0",
            background:
              "radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, transparent 72%)",
          }}
        />
      </div>

      {/* Tap hint */}
      <p
        style={{
          marginTop: "28px",
          color: "#9a8878",
          fontSize: "12px",
          letterSpacing: "0.06em",
          opacity: isOpening ? 0 : 1,
          transition: "opacity 0.2s",
        }}
      >
        ドアをタップして入る
      </p>
    </main>
  );
}
