"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, MessageCircle, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarContext } from "./SidebarContext";

const tabs = [
  { label: "Match", icon: Users, path: "members" },
  { label: "ルーム", icon: MessageCircle, path: "rooms" },
  { label: "スケジュール", icon: Calendar, path: "schedule" },
] as const;

export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = use(params);
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const participantId = localStorage.getItem(`participant_${invite_code}`);
    if (!participantId) return;
    createClient()
      .from("participants")
      .select("name")
      .eq("id", participantId)
      .single()
      .then(({ data }) => {
        if (data?.name) setUserName(data.name);
      });
  }, [invite_code]);

  const handleLogout = () => {
    localStorage.removeItem(`participant_${invite_code}`);
    setIsOpen(false);
    router.push("/");
  };

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setIsOpen(true) }}>
      {/* Main layout */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 pb-[60px]">{children}</div>
        <nav
          className="fixed h-[60px] bg-white border-t border-gray-200 flex z-50"
          style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", width: "390px" }}
        >
          {tabs.map(({ label, icon: Icon, path }) => {
            const href = `/e/${invite_code}/${path}`;
            const isActive =
              pathname === href ||
              (path === "members" && pathname === `/e/${invite_code}`);
            return (
              <Link
                key={path}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar overlay — always in DOM for slide animation */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      >
        {/* Constrain to 390px so sidebar aligns with app content */}
        <div
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ left: "50%", transform: "translateX(-50%)", width: "390px" }}
        >
          {/* Sidebar drawer */}
          <div
            className={`absolute top-0 left-0 h-full bg-white flex flex-col transition-transform duration-300 ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ width: "75%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User area */}
            <div className="px-5 pt-12 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <span className="text-sm font-bold text-gray-500">
                  {userName ? userName[0] : "?"}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {userName ?? "ゲスト"}
              </p>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-2">
              <Link
                href={`/e/${invite_code}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-50 transition-colors"
              >
                <span className="text-base">👤</span>
                <span>設定</span>
              </Link>
              <Link
                href={`/e/${invite_code}/history`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-50 transition-colors"
              >
                <span className="text-base">📅</span>
                <span>参加履歴</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-50 transition-colors"
              >
                <span className="text-base">🚪</span>
                <span>ログアウト</span>
              </button>
            </nav>

            {/* App name */}
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-300 font-medium tracking-wide">
                Before Party
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
