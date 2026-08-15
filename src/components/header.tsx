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
  const title = TITLES[pathname] ?? (pathname.startsWith("/dashboard/projects/") ? "Dettaglio progetto" : "Impact Forge");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
      <div>
        <h1 className="text-base font-bold text-slate-900">{title}</h1>
        <p className="text-[11px] text-slate-400">
          {pathname.startsWith("/dashboard/projects/")
            ? "RF-02 Foundry · RF-04 Blended Finance · RF-05 Underwriting · RF-08 MRV"
            : "System of Creation & Orchestration per progetti di impatto"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Event Ledger attivo · MRV sync 2 min fa
        </div>

        <div className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
            {initials(user.name)}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-xs font-bold text-slate-900">{user.name}</div>
            <div className="text-[10px] text-slate-400">{user.orgName ?? "—"}</div>
          </div>
          <div className="relative">
            <select
              value={user.id}
              onChange={(e) => setUserId(Number(e.target.value))}
              className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
              title="Cambia ruolo (demo RBAC)"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {ROLE_LABELS[u.role]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <span
          className={cn(
            "hidden rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide lg:inline",
            ROLE_BADGE[user.role]
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>
    </header>
  );
}
