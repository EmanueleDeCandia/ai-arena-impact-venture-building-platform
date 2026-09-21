"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useRole } from "@/components/role-provider";
import { ROLE_BADGE, ROLE_LABELS } from "@/lib/permissions";
import { cn, initials } from "@/lib/format";

const TITLES: Record<string, string> = {
  "/dashboard": "Panoramica piattaforma",
  "/dashboard/opportunities": "Radar Opportunità — Need Sensing",
  "/dashboard/projects": "Progetti / Pipeline",
  "/dashboard/ai": "AI Console — 6 agenti",
  "/dashboard/audit": "Audit Log",
};

export function Header() {
  const pathname = usePathname();
  const { user, users, setUserId } = useRole();
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/dashboard/projects/") ? "Dettaglio progetto" : "Impact Forge");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/70 bg-[#eae3d3]/90 px-6 py-3.5 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(45,35,20,0.12)]">
      <div>
        <h1 className="text-engraved text-base font-black tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h1>
        <p className="text-engraved-subtle text-[11px] font-medium text-slate-500">
          {pathname.startsWith("/dashboard/projects/")
            ? "RF-02 Foundry · RF-04 Blended Finance · RF-05 Underwriting · RF-08 MRV"
            : "System of Creation & Orchestration per progetti di impatto"}
        </p>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Status indicator pill */}
        <div className="tactile-pill hidden items-center gap-2 border-emerald-500/20 bg-gradient-to-b from-emerald-50 to-teal-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 md:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-600 filter drop-shadow-sm" />
          <span>Event Ledger attivo · MRV sync 2 min fa</span>
        </div>

        {/* User profile and role selector pill */}
        <div className="tactile-pill flex items-center gap-2.5 bg-gradient-to-b from-white to-slate-50 p-1.5 pl-2 shadow-sm">
          <div className="tactile-icon-well flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-[10px] font-black text-white">
            {initials(user.name)}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-engraved text-xs font-bold leading-tight text-slate-900">
              {user.name}
            </div>
            <div className="text-engraved-subtle text-[10px] font-medium text-slate-500">
              {user.orgName ?? "—"}
            </div>
          </div>

          <div className="relative">
            <select
              value={user.id}
              onChange={(e) => setUserId(Number(e.target.value))}
              className="tactile-input cursor-pointer appearance-none rounded-full py-1 pl-2.5 pr-7 text-xs font-bold text-slate-700 outline-none"
              title="Cambia ruolo (demo RBAC)"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {ROLE_LABELS[u.role]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <span
          className={cn(
            "tactile-pill hidden px-3 py-1 text-[10px] font-black uppercase tracking-wider lg:inline",
            ROLE_BADGE[user.role]
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>
    </header>
  );
}
