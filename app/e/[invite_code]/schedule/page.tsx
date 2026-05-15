"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";

type EventItem = {
  title: string;
  date: string;
  time: string;
  participants: number;
  location: string;
  description: string;
  organizer: string;
  tags: string[];
};

const DUMMY_EVENTS: EventItem[] = [
  {
    title: "テストイベント",
    date: "2026-06-01",
    time: "18:00",
    participants: 12,
    location: "渋谷ヒカリエ 8F",
    description:
      "エンジニア・デザイナー・起業家が集まる交流イベント。参加前にプロフィールを見て、話したい人を見つけよう。初めての方も大歓迎です。",
    organizer: "なつき",
    tags: ["#エンジニア", "#交流会", "#スタートアップ"],
  },
  {
    title: "AI勉強会",
    date: "2026-06-15",
    time: "19:00",
    participants: 8,
    location: "渋谷ヒカリエ 8F",
    description:
      "最新のAIトレンドや実践事例を共有する勉強会。LTや議論を通じてAI活用のヒントを持ち帰ろう。",
    organizer: "なつき",
    tags: ["#AI", "#勉強会", "#エンジニア"],
  },
  {
    title: "起業家LT会",
    date: "2026-07-01",
    time: "18:30",
    participants: 20,
    location: "渋谷ヒカリエ 8F",
    description:
      "起業家・スタートアップ関係者によるライトニングトーク。事業の課題・学び・失敗談をシェアし合う場です。",
    organizer: "なつき",
    tags: ["#起業家", "#LT", "#スタートアップ"],
  },
];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// Fake avatar colors and initials for the participant icon row
const AVATAR_COLORS = ["#4A90D9", "#7B61FF", "#E05C5C", "#F59E0B", "#34D399"];
const AVATAR_INITIALS = ["田", "佐", "鈴", "山", "中"];

// ── Calendar helpers ───────────────────────────────────────────────────────────
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

type CalDay = { year: number; month: number; day: number; current: boolean };

function buildCalGrid(year: number, month: number): CalDay[] {
  const total = daysInMonth(year, month);
  const start = firstWeekday(year, month);
  const days: CalDay[] = [];
  const prev = shiftMonth(year, month, -1);
  const prevTotal = daysInMonth(prev.year, prev.month);
  for (let i = start - 1; i >= 0; i--)
    days.push({ ...prev, day: prevTotal - i, current: false });
  for (let d = 1; d <= total; d++)
    days.push({ year, month, day: d, current: true });
  const next = shiftMonth(year, month, 1);
  const cells = Math.ceil(days.length / 7) * 7;
  for (let d = 1; days.length < cells; d++)
    days.push({ ...next, day: d, current: false });
  return days;
}

// ── Participant icons ──────────────────────────────────────────────────────────
function ParticipantIcons({ count }: { count: number }) {
  const shown = Math.min(count, 5);
  const extra = count - shown;
  return (
    <div className="flex items-center">
      {Array.from({ length: shown }, (_, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
          style={{
            backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            marginLeft: i > 0 ? "-6px" : 0,
          }}
        >
          {AVATAR_INITIALS[i]}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 text-[10px] font-semibold border-2 border-white"
          style={{ marginLeft: "-6px" }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Shared event card ──────────────────────────────────────────────────────────
function EventCard({
  event,
  inviteCode,
  isPast = false,
}: {
  event: EventItem;
  inviteCode: string;
  isPast?: boolean;
}) {
  const dateLabel = new Date(event.date + "T00:00:00").toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isPast ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      {/* Past badge */}
      {isPast && (
        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mb-2 inline-block">
          終了
        </span>
      )}

      {/* Title */}
      <p className={`text-base font-bold mb-1 ${isPast ? "text-gray-400" : "text-gray-900"}`}>
        {event.title}
      </p>

      {/* Date & time */}
      <p className={`text-xs mb-1 ${isPast ? "text-gray-300" : "text-gray-500"}`}>
        {dateLabel}　{event.time}〜
      </p>

      {/* Location */}
      <div
        className={`flex items-center gap-1 text-xs mb-3 ${
          isPast ? "text-gray-300" : "text-gray-400"
        }`}
      >
        <MapPin size={11} />
        <span>{event.location}</span>
      </div>

      {/* Description */}
      <p
        className={`text-xs leading-relaxed mb-3 line-clamp-2 ${
          isPast ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {event.description}
      </p>

      {/* Separator */}
      <div className="border-t border-gray-100 mb-3" />

      {/* Participants */}
      <div className="flex items-center justify-between mb-3">
        <ParticipantIcons count={event.participants} />
        <div
          className={`flex items-center gap-1 text-xs ${
            isPast ? "text-gray-300" : "text-gray-400"
          }`}
        >
          <Users size={11} />
          <span>{event.participants}人参加</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        {/* 詳細を見る — outline, navigates to detail page */}
        <Link
          href={`/e/${inviteCode}/schedule/${event.date}`}
          className={`block w-full text-center text-sm font-semibold py-2.5 rounded-xl border transition-colors active:opacity-80 ${
            isPast
              ? "border-gray-200 text-gray-400"
              : "border-gray-900 text-gray-900 hover:bg-gray-50"
          }`}
        >
          詳細を見る
        </Link>

        {/* ルームに入る — filled */}
        <Link
          href={`/e/${inviteCode}/rooms`}
          className={`block w-full text-center text-sm font-semibold py-2.5 rounded-xl transition-opacity active:opacity-80 ${
            isPast ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white"
          }`}
        >
          ルームに入る
        </Link>
      </div>
    </div>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────
function CalendarView({
  events,
  year,
  month,
  onPrev,
  onNext,
  inviteCode,
}: {
  events: EventItem[];
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  inviteCode: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const eventDateSet = new Set(events.map((e) => e.date));
  const grid = buildCalGrid(year, month);
  const selectedEvents = selected ? events.filter((e) => e.date === selected) : [];
  const monthLabel = new Date(year, month, 1).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-medium py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-2 gap-y-1">
        {grid.map((cell, idx) => {
          const dateStr = toDateStr(cell.year, cell.month, cell.day);
          const hasEvent = eventDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          const isSun = idx % 7 === 0;
          const isSat = idx % 7 === 6;

          return (
            <button
              key={idx}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              className="flex flex-col items-center py-1 gap-0.5"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white"
                    : isToday
                      ? "bg-gray-200 text-gray-900 font-bold"
                      : !cell.current
                        ? "text-gray-300"
                        : isSun
                          ? "text-red-400"
                          : isSat
                            ? "text-blue-400"
                            : "text-gray-800"
                }`}
              >
                {cell.day}
              </span>
              <span
                className={`w-1 h-1 rounded-full transition-opacity ${
                  hasEvent && cell.current ? "bg-gray-800 opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Event cards for selected date */}
      {selectedEvents.length > 0 && (
        <div className="px-4 pt-2 border-t border-gray-100 flex flex-col gap-3">
          {selectedEvents.map((e) => (
            <EventCard key={e.date + e.title} event={e} inviteCode={inviteCode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timeline View ──────────────────────────────────────────────────────────────
function TimelineView({ events, inviteCode }: { events: EventItem[]; inviteCode: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-3 px-4 pt-2">
      {sorted.map((e) => {
        const isPast = new Date(e.date + "T00:00:00") < today;
        return (
          <EventCard key={e.date + e.title} event={e} inviteCode={inviteCode} isPast={isPast} />
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const params = useParams();
  const inviteCode = Array.isArray(params.invite_code)
    ? params.invite_code[0]
    : (params.invite_code ?? "");

  const [view, setView] = useState<"calendar" | "timeline">("calendar");
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5);

  const handlePrev = () => {
    const { year, month } = shiftMonth(calYear, calMonth, -1);
    setCalYear(year);
    setCalMonth(month);
  };
  const handleNext = () => {
    const { year, month } = shiftMonth(calYear, calMonth, 1);
    setCalYear(year);
    setCalMonth(month);
  };

  return (
    <main
      className="flex flex-col overflow-hidden bg-white"
      style={{ maxWidth: "390px", margin: "0 auto", height: "calc(100dvh - 60px)" }}
    >
      {/* Toggle */}
      <div className="shrink-0 flex gap-2 px-4 pt-4 pb-3">
        {(["calendar", "timeline"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              view === v
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {v === "calendar" ? "カレンダー" : "タイムライン"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {view === "calendar" ? (
          <CalendarView
            events={DUMMY_EVENTS}
            year={calYear}
            month={calMonth}
            onPrev={handlePrev}
            onNext={handleNext}
            inviteCode={inviteCode}
          />
        ) : (
          <TimelineView events={DUMMY_EVENTS} inviteCode={inviteCode} />
        )}
      </div>
    </main>
  );
}
