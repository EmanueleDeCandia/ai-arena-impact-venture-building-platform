import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { ensureSeeded, loadProjectList } from "@/lib/loaders";
import { STATUS_LABEL, WORKFLOW } from "@/lib/workflow";
import { fmtEURCompact } from "@/lib/format";
import { CreateProjectButton } from "@/components/create-project";
import { Card, ProgressBar, SectionTitle, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await ensureSeeded();
  const list = await loadProjectList();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Pipeline delle venture</h2>
          <p className="text-sm text-slate-500">
            Kanban per stato del workflow: Sourcing → Due Diligence → Structuring → Monitoring → Exit
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {WORKFLOW.map((w) => {
          const items = list.filter((p) => p.status === w.key);
          if (items.length === 0) return null;
          return (
            <div key={w.key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">{STATUS_LABEL[w.key]}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="block">
                    <Card className="p-4 transition hover:border-emerald-300 hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      {p.tagline && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.tagline}</p>}
                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.territory}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {p.stakeholderCount}
                        </span>
                        <span className="ml-auto font-bold text-slate-700">{fmtEURCompact(p.fundingTotal)}</span>
                      </div>
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>KPI</span>
                          <span>{p.kpiAvgProgress}%</span>
                        </div>
                        <ProgressBar value={p.kpiAvgProgress} className="mt-1 h-1.5" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="p-4">
        <SectionTitle title="Legenda workflow" />
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          {WORKFLOW.map((w) => (
            <span key={w.key}>
              <b className="text-slate-700">{w.label}</b>: {w.key === "OPPORTUNITY" && "bisogno rilevato"}
              {w.key === "FOUNDRY_DRAFT" && "bozza di venture"}
              {w.key === "CO_DESIGN" && "canvas ToC + RACI con gli stakeholder"}
              {w.key === "STRUCTURED" && "blended finance con leva ≥ 2x"}
              {w.key === "UNDERWRITING" && "score integrato ≥ 60 + Term Sheet"}
              {w.key === "FUNDING_COMMITTED" && "funding vincolato"}
              {w.key === "EXECUTION" && "venture operativa"}
              {w.key === "MRV_MONITORING" && "evidenze e SROI dinamico"}
              {w.key === "EXIT_SCALE" && "uscita o scaling"}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
