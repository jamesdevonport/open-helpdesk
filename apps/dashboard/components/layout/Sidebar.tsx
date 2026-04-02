"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Users,
  Eye,
  BookOpen,
  BarChart3,
  Megaphone,
  Palette,
  Mail,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";

const navigation = [
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Visitors", href: "/visitors", icon: Eye },
  { name: "Help Desk", href: "/helpdesk", icon: BookOpen },
  { name: "Updates", href: "/updates", icon: Megaphone },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const settingsNav = [
  { name: "Widget", href: "/settings/widget", icon: Palette },
  { name: "Email", href: "/settings/email", icon: Mail },
  { name: "Team", href: "/settings/team", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const me = useQuery(api.agents.me);
  const initials = (me?.name || "OH")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <aside className="flex h-screen w-[220px] flex-col bg-[#0c1929] shrink-0">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-white/90"
        >
          Open Helpdesk
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        {/* Settings section */}
        <div className="pt-5">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Settings
          </span>
          <div className="mt-2 space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1977f2] text-[11px] font-bold text-white">
            {initials || "OH"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[12px] font-medium text-white/80">
              {me?.name || "Workspace Owner"}
            </p>
            <p className="truncate text-[10px] text-white/40">
              {me?.role || "Admin"}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
