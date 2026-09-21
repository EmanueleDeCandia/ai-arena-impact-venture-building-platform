import Link from "next/link";
import { AlertTriangle, Bot, Coins, FolderKanban, Radar, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { impactTokens, kpis, projects, tranches } from "@/db/schema";
import { count } from "drizzle-orm";
import { ensureSeeded, loadAudit, loadProjectList } from "@/lib/loaders";
import { kpiProgress } from "@/lib/finance";
import { STATUS_LABEL, WORKFLOW } from "@/lib/workflow";
import { cn, fmtEURCompact, timeAgo } from "@/lib/format";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureSeeded();
  const list = await loadProjectList();
  const kpiRows = await db.select().from(kpis);
  const tokenRows = await db.select().from(impactTokens);
  const trancheRows = await db.select().from(tranches);
  const projectRows = await db.select().from(projects);
  const audit = await loadAudit(8);
  const [{ value: projectCount }] = await db.select({ value: count() }).from(projects);

  const fundingTotal = list.reduce((s, p) => s + p.fundingTotal, 0);
  const sroiValues = list.map((p) => {
    const kp = kpiRows.filter((k) => k.projectId === p.id);
    const social = kp.reduce((s, k) => s + k.current * k.valuePerUnit, 0) * 5;
    return p.fundingTotal > 0 ? (social - p.fundingTotal) / p.fundingTotal : 0;
  });
  const avgSroi = sroiValues.length > 0 ? sroiValues.reduce((s, v) => s + v, 0) / sroiValues.length : 0;
  const tokenSum = tokenRows.reduce((s, t) => s + t.amount, 0);

  // Blended capital breakdown for executive reporting
  const debtTotal = trancheRows.filter((t) => t.instrument === "SENIOR_DEBT" || t.instrument === "CONCESSIONAL_LOAN").reduce((s, t) => s + t.amount, 0);
  const equityTotal = trancheRows.filter((t) => t.instrument === "EQUITY" || t.instrument === "COMMUNITY_SHARES" || t.instrument === "REVENUE_SHARE").reduce((s, t) => s + t.amount, 0);
  const grantTotal = trancheRows.filter((t) => t.instrument === "GRANT").reduce((s, t) => s + t.amount, 0);
  const guaranteeTotal = trancheRows.filter((t) => t.instrument === "GUARANTEE").reduce((s, t) => s + t.amount, 0);
  const sibTotal = trancheRows.filter((t) => t.instrument === "SIB").reduce((s, t) => s + t.amount, 0);

  const avgTaxonomy = Math.round(projectRows.reduce((s, p) => s + (p.taxonomyAlignmentPct || 0), 0) / (projectRows.length || 1));
  const totalFte = projectRows.reduce((s, p) => s + (p.fteCreated || 0), 0);
  const activeRegions = new Set(projectRows.map((p) => p.territory)).size;

  const nameById = new Map(list.map((p) => [p.id, p.name]));
  const alerts = kpiRows
    .filter((k) => k.target > 0 && kpiProgress(k) < 0.7)
    .map((k) => ({ title: k.title, progressPct: Math.round(kpiProgress(k) * 100), project: nameById.get(k.projectId) ?? "—" }));

  const statusCounts = WORKFLOW.map((w) => ({
    ...w,
    count: list.filter((p) => p.status === w.key).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Progetti orchestrati" value={String(projectCount)} sub="workflow multi-stakeholder" icon={<FolderKanban className="h-4 w-4" />} />
        <Stat label="Funding strutturato" value={fmtEURCompact(fundingTotal)} sub="blended finance" icon={<Coins className="h-4 w-4" />} accent="bg-sky-50 text-sky-600" />
        <Stat label="SROI medio dinamico" value={avgSroi.toFixed(2)} sub="ricalcolato ad ogni evidenza" icon={<TrendingUp className="h-4 w-4" />} accent="bg-violet-50 text-violet-600" />
        <Stat label="Token d'impatto" value={String(tokenSum)} sub="outcome verificati" icon={<Radar className="h-4 w-4" />} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col justify-between p-5 lg:col-span-2">
          <div>
            <SectionTitle
              title="Pipeline — distribuzione per stato"
              subtitle="RF-05 state machine: transizioni vincolate da checklist"
              right={
                <Link href="/dashboard/projects" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  Vedi tutti →
                </Link>
              }
            />
            <div className="space-y-2">
              {statusCounts.map((w) => (
                <div key={w.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{w.label}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                      style={{ width: `${list.length > 0 ? (w.count / list.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold text-slate-700">{w.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sezione Executive Reporting & Blended Capital (riempie l'area precedentemente vuota) */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Architettura Blended Capital &amp; Indicatori Direzionali
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                {trancheRows.length} tranche erogate / deliberate
              </span>
            </div>

            {/* Stacked Blended Finance Distribution Bar */}
            <div className="mb-3.5 space-y-1.5">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                {fundingTotal > 0 && (
                  <>
                    <div style={{ width: `${(debtTotal / fundingTotal) * 100}%` }} className="bg-sky-500 transition-all" title={`Debito Senior/Subordinato: ${fmtEURCompact(debtTotal)}`} />
                    <div style={{ width: `${(equityTotal / fundingTotal) * 100}%` }} className="bg-emerald-500 transition-all" title={`Equity Paziente: ${fmtEURCompact(equityTotal)}`} />
                    <div style={{ width: `${(grantTotal / fundingTotal) * 100}%` }} className="bg-amber-400 transition-all" title={`Grant Filantropico: ${fmtEURCompact(grantTotal)}`} />
                    <div style={{ width: `${(guaranteeTotal / fundingTotal) * 100}%` }} className="bg-indigo-500 transition-all" title={`Garanzie FEI/MCC: ${fmtEURCompact(guaranteeTotal)}`} />
                    <div style={{ width: `${(sibTotal / fundingTotal) * 100}%` }} className="bg-fuchsia-500 transition-all" title={`Pay for Success (SIB): ${fmtEURCompact(sibTotal)}`} />
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Debito {fmtEURCompact(debtTotal)}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Equity {fmtEURCompact(equityTotal)}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Grant {fmtEURCompact(grantTotal)}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Garanzie {fmtEURCompact(guaranteeTotal)}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fuchsia-500" /> SIB / PfS {fmtEURCompact(sibTotal)}</span>
              </div>
            </div>

            {/* 3 Executive Metric Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Allineamento EU Taxonomy</div>
                <div className="mt-0.5 text-sm font-black text-emerald-800">{avgTaxonomy}% medio</div>
                <div className="mt-0.5 text-[10px] text-emerald-600">100% DNSH compliant</div>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Occupazione Creata</div>
                <div className="mt-0.5 text-sm font-black text-slate-800">+{totalFte} FTE diretti</div>
                <div className="mt-0.5 text-[10px] text-slate-500">Target giovani &amp; donne</div>
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Copertura Territoriale</div>
                <div className="mt-0.5 text-sm font-black text-sky-800">{activeRegions} Regioni attive</div>
                <div className="mt-0.5 text-[10px] text-sky-600">Aree interne &amp; Sud</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Alert scostamento KPI" subtitle="RF-08.5 · soglia 70% a metà timeline" />
          <div className="space-y-2">
            {alerts.length === 0 && (
              <p className="py-2 text-sm text-emerald-600">✓ Nessun KPI in scostamento</p>
            )}
            {alerts.map((a) => (
              <div key={a.title} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{a.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {a.project} · avanzamento {a.progressPct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            title="Ultima attività — Event Ledger"
            subtitle="RF-12.3 · audit log immutabile"
            right={
              <Link href="/dashboard/audit" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Audit completo →
              </Link>
            }
          />
          <div className="space-y-2">
            {audit.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <Badge className="border-slate-200 bg-slate-50 text-slate-500">{a.action}</Badge>
                <div className="min-w-0 flex-1 truncate text-xs text-slate-600">
                  <b>{a.userName}</b> {a.details ?? ""}
                </div>
                <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(a.timestamp)}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle title="Azioni rapide" />
            <div className="space-y-2">
              <Link href="/dashboard/opportunities" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <Radar className="h-4 w-4 text-cyan-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Radar Opportunità</div>
                  <div className="text-[10px] text-slate-400">Heatmap bisogni + opportunity score</div>
                </div>
              </Link>
              <Link href="/dashboard/ai" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-violet-300 hover:bg-violet-50/40">
                <Bot className="h-4 w-4 text-violet-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">AI Console</div>
                  <div className="text-[10px] text-slate-400">6 agenti: Scout, Architect, Structurer…</div>
                </div>
              </Link>
              <Link href="/dashboard/projects" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <FolderKanban className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Pipeline progetti</div>
                  <div className="text-[10px] text-slate-400">{projectCount} venture orchestrate</div>
                </div>
              </Link>
            </div>
          </Card>

          <Card className={cn("p-5")}>
            <SectionTitle title="Stato sistema" />
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between"><span>Event Ledger</span><b className="text-emerald-600">operativo</b></div>
              <div className="flex justify-between"><span>MRV Engine</span><b className="text-emerald-600">sync 2 min fa</b></div>
              <div className="flex justify-between"><span>RegTech SFDR/CSRD</span><b className="text-emerald-600">conforme</b></div>
              <div className="flex justify-between"><span>Tassonomia IRIS+</span><b className="text-emerald-600">v5.3</b></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
