"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, MessageCircle, Calendar } from "lucide-react";
import { use } from "react";

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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-[60px]">{children}</div>
      <nav
        className="fixed h-[60px] bg-white border-t border-gray-200 flex z-50"
        style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", width: "390px" }}
      >
        {tabs.map(({ label, icon: Icon, path }) => {
          const href = `/e/${invite_code}/${path}`;
          const isActive = pathname === href || (path === "members" && pathname === `/e/${invite_code}`);
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
  );
}
