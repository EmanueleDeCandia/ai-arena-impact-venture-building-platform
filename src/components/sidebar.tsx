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
    <aside className="tactile-sidebar sticky top-0 flex h-screen w-64 shrink-0 flex-col">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="tactile-icon-well flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 text-slate-950 shadow-md">
          <Sparkles className="h-5 w-5 fill-slate-950/20 text-slate-950" />
        </div>
        <div>
          <div className="text-engraved text-base font-black tracking-widest text-slate-900">
            IMPACT FORGE
          </div>
          <div className="text-engraved-subtle text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Venture Building OS
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="mt-2 flex-1 space-y-2 px-3.5">
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
                "tactile-nav-item flex items-center gap-3.5 px-4 py-3 text-sm transition-all",
                active
                  ? "tactile-nav-active font-black text-emerald-950"
                  : "tactile-nav-inactive font-bold text-slate-700 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active ? "text-emerald-800 scale-105" : "text-slate-500"
                )}
              />
              <span className={active ? "text-engraved-emerald" : "text-engraved"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Pod */}
      <div className="space-y-3 px-4 py-5 text-[11px]">
        <div className="tactile-sunken rounded-2xl p-3.5">
          <div className="text-engraved mb-1 font-black text-slate-900">
            5 livelli funzionali
          </div>
          <p className="text-engraved-subtle text-[10px] font-semibold leading-relaxed text-slate-600">
            Presentation · Orchestration · Intelligence · Financial Structuring · Trust &amp; Compliance
          </p>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-engraved-subtle font-bold text-slate-600">v1.0 · MVP Fasi 1-4</span>
          <span className="tactile-pill flex items-center gap-1.5 border-emerald-500/30 bg-gradient-to-b from-emerald-50 to-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600 shadow-sm shadow-emerald-500" />
            live
          </span>
        </div>
      </div>
    </aside>
  );
}
