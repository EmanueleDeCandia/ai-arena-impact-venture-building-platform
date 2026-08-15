"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bot,
  FolderKanban,
  LayoutDashboard,
  Radar,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "project.view" },
  { href: "/dashboard/qualificazione", label: "Qualificazione & IMP", icon: Award, perm: "project.view" },
  { href: "/dashboard/opportunities", label: "Radar Opportunità", icon: Radar, perm: "opportunity.view" },
  { href: "/dashboard/projects", label: "Progetti / Pipeline", icon: FolderKanban, perm: "project.view" },
  { href: "/dashboard/ai", label: "AI Console", icon: Bot, perm: "agent.all" },
  { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText, perm: "audit.view" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useRole();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-900/40">
          <Sparkles className="h-5 w-5 text-slate-950" />
        </div>
        <div>
          <div className="text-sm font-black tracking-widest text-white">IMPACT FORGE</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
            Venture Building OS
          </div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.filter((item) => hasPerm(user.role, item.perm)).map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-5 py-5 text-[11px] text-slate-500">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-1 font-bold text-slate-300">5 livelli funzionali</div>
          <p>Presentation · Orchestration · Intelligence · Financial Structuring · Trust &amp; Compliance</p>
        </div>
        <div className="flex items-center justify-between">
          <span>v1.0 · MVP Fasi 1-4</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            live
          </span>
        </div>
      </div>
    </aside>
  );
}
