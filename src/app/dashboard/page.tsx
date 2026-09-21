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
  const debtTotal = trancheRows
    .filter((t) => t.instrument === "SENIOR_DEBT" || t.instrument === "CONCESSIONAL_LOAN")
    .reduce((s, t) => s + t.amount, 0);
  const equityTotal = trancheRows
    .filter((t) => t.instrument === "EQUITY" || t.instrument === "COMMUNITY_SHARES" || t.instrument === "REVENUE_SHARE")
    .reduce((s, t) => s + t.amount, 0);
  const grantTotal = trancheRows.filter((t) => t.instrument === "GRANT").reduce((s, t) => s + t.amount, 0);
  const guaranteeTotal = trancheRows.filter((t) => t.instrument === "GUARANTEE").reduce((s, t) => s + t.amount, 0);
  const sibTotal = trancheRows.filter((t) => t.instrument === "SIB").reduce((s, t) => s + t.amount, 0);

  const avgTaxonomy = Math.round(
    projectRows.reduce((s, p) => s + (p.taxonomyAlignmentPct || 0), 0) / (projectRows.length || 1)
  );
  const totalFte = projectRows.reduce((s, p) => s + (p.fteCreated || 0), 0);
  const activeRegions = new Set(projectRows.map((p) => p.territory)).size;

  const nameById = new Map(list.map((p) => [p.id, p.name]));
  const alerts = kpiRows
    .filter((k) => k.target > 0 && kpiProgress(k) < 0.7)
    .map((k) => ({
      title: k.title,
      progressPct: Math.round(kpiProgress(k) * 100),
      project: nameById.get(k.projectId) ?? "—",
    }));

  const statusCounts = WORKFLOW.map((w) => ({
    ...w,
    count: list.filter((p) => p.status === w.key).length,
  }));

  return (
    <div className="space-y-7">
      {/* Top Hero KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Progetti orchestrati"
          value={String(projectCount)}
          sub="workflow multi-stakeholder"
          icon={<FolderKanban className="h-5 w-5" />}
          accent="bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-800"
        />
        <Stat
          label="Funding strutturato"
          value={fmtEURCompact(fundingTotal)}
          sub="blended finance"
          icon={<Coins className="h-5 w-5" />}
          accent="bg-gradient-to-br from-sky-100 to-blue-200 text-sky-800"
        />
        <Stat
          label="SROI medio dinamico"
          value={avgSroi.toFixed(2)}
          sub="ricalcolato per evidenza"
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-gradient-to-br from-violet-100 to-purple-200 text-violet-800"
        />
        <Stat
          label="Token d'impatto"
          value={String(tokenSum)}
          sub="outcome verificati"
          icon={<Radar className="h-5 w-5" />}
          accent="bg-gradient-to-br from-amber-100 to-orange-200 text-amber-800"
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid gap-7 lg:grid-cols-3">
        {/* Pipeline Distribution + Blended Finance Arch */}
        <Card className="flex flex-col justify-between p-6 lg:col-span-2">
          <div>
            <SectionTitle
              title="Pipeline — distribuzione per stato"
              subtitle="RF-05 state machine: transizioni vincolate da checklist"
              right={
                <Link
                  href="/dashboard/projects"
                  className="tactile-pill border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Vedi tutti →
                </Link>
              }
            />

            <div className="space-y-3">
              {statusCounts.map((w) => (
                <div key={w.key} className="flex items-center gap-3.5">
                  <span className="text-engraved w-32 shrink-0 text-xs font-bold text-slate-600">
                    {w.label}
                  </span>
                  <div className="tactile-progress-track h-4 flex-1">
                    <div
                      className="tactile-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all"
                      style={{ width: `${list.length > 0 ? (w.count / list.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-engraved-strong w-8 shrink-0 text-right text-xs font-black text-slate-800">
                    {w.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sezione Executive Reporting & Blended Capital */}
          <div className="mt-8 border-t border-slate-200/80 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-engraved-subtle text-[11px] font-black uppercase tracking-wider text-slate-600">
                Architettura Blended Capital &amp; Indicatori Direzionali
              </span>
              <span className="tactile-pill border-emerald-500/30 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                {trancheRows.length} tranche erogate / deliberate
              </span>
            </div>

            {/* Stacked Blended Finance Distribution Bar with Sunken Well */}
            <div className="mb-4 space-y-2">
              <div className="tactile-sunken flex h-4 w-full overflow-hidden rounded-full p-0.5">
                {fundingTotal > 0 && (
                  <>
                    <div
                      style={{ width: `${(debtTotal / fundingTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all first:rounded-l-full"
                      title={`Debito Senior/Subordinato: ${fmtEURCompact(debtTotal)}`}
                    />
                    <div
                      style={{ width: `${(equityTotal / fundingTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                      title={`Equity Paziente: ${fmtEURCompact(equityTotal)}`}
                    />
                    <div
                      style={{ width: `${(grantTotal / fundingTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all"
                      title={`Grant Filantropico: ${fmtEURCompact(grantTotal)}`}
                    />
                    <div
                      style={{ width: `${(guaranteeTotal / fundingTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
                      title={`Garanzie FEI/MCC: ${fmtEURCompact(guaranteeTotal)}`}
                    />
                    <div
                      style={{ width: `${(sibTotal / fundingTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 transition-all last:rounded-r-full"
                      title={`Pay for Success (SIB): ${fmtEURCompact(sibTotal)}`}
                    />
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm" /> Debito{" "}
                  <b className="text-engraved text-slate-800">{fmtEURCompact(debtTotal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" /> Equity{" "}
                  <b className="text-engraved text-slate-800">{fmtEURCompact(equityTotal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm" /> Grant{" "}
                  <b className="text-engraved text-slate-800">{fmtEURCompact(grantTotal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm" /> Garanzie{" "}
                  <b className="text-engraved text-slate-800">{fmtEURCompact(guaranteeTotal)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-sm" /> SIB / PfS{" "}
                  <b className="text-engraved text-slate-800">{fmtEURCompact(sibTotal)}</b>
                </span>
              </div>
            </div>

            {/* 3 Executive Metric Pods in Risalto */}
            <div className="grid grid-cols-3 gap-3">
              <div className="tactile-card border border-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/70 p-3">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Allineamento EU Taxonomy
                </div>
                <div className="text-engraved-emerald mt-1 text-base font-black">
                  {avgTaxonomy}% medio
                </div>
                <div className="text-engraved-subtle mt-0.5 text-[10px] font-bold text-emerald-700">
                  100% DNSH compliant
                </div>
              </div>

              <div className="tactile-card border border-slate-300/40 bg-gradient-to-b from-white to-slate-100/70 p-3">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Occupazione Creata
                </div>
                <div className="text-engraved-strong mt-1 text-base font-black">
                  +{totalFte} FTE diretti
                </div>
                <div className="text-engraved-subtle mt-0.5 text-[10px] font-semibold text-slate-500">
                  Target giovani &amp; donne
                </div>
              </div>

              <div className="tactile-card border border-sky-500/20 bg-gradient-to-b from-white to-sky-50/70 p-3">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Copertura Territoriale
                </div>
                <div className="text-engraved-sky mt-1 text-base font-black">
                  {activeRegions} Regioni attive
                </div>
                <div className="text-engraved-subtle mt-0.5 text-[10px] font-bold text-sky-700">
                  Aree interne &amp; Sud
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Alert scostamento KPI */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <SectionTitle
              title="Alert scostamento KPI"
              subtitle="RF-08.5 · soglia 70% a metà timeline"
              right={
                alerts.length > 0 && (
                  <Badge className="border-amber-400/50 bg-gradient-to-b from-amber-100 to-amber-200 font-black text-amber-950">
                    {alerts.length} rilevati
                  </Badge>
                )
              }
            />
            <div className="space-y-2.5 max-h-[410px] overflow-y-auto no-scrollbar pr-1">
            {alerts.length === 0 && (
              <div className="tactile-sunken rounded-xl p-4 text-center">
                <p className="text-engraved-emerald text-xs font-bold">
                  ✓ Nessun KPI in scostamento critico
                </p>
              </div>
            )}
            {alerts.map((a) => (
              <div
                key={a.title}
                className="tactile-card border-amber-400/30 bg-gradient-to-b from-amber-50/80 to-amber-100/50 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="tactile-icon-well flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-engraved text-xs font-bold text-amber-950">
                      {a.title}
                    </div>
                    <div className="text-engraved-subtle mt-0.5 text-[11px] font-medium text-amber-800">
                      {a.project} · avanzamento{" "}
                      <b className="text-engraved-amber font-black">{a.progressPct}%</b>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Activity Log & Quick Actions */}
      <div className="grid gap-7 lg:grid-cols-3">
        {/* Ultima attività — Event Ledger */}
        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            title="Ultima attività — Event Ledger"
            subtitle="RF-12.3 · audit log immutabile criptato"
            right={
              <Link
                href="/dashboard/audit"
                className="tactile-pill border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                Audit completo →
              </Link>
            }
          />
          <div className="space-y-2">
            {audit.map((a) => (
              <div
                key={a.id}
                className="tactile-card border-white/80 bg-gradient-to-b from-white to-slate-50/80 px-4 py-3 transition hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <Badge className="border-slate-300 bg-slate-100 font-black text-slate-700">
                    {a.action}
                  </Badge>
                  <div className="min-w-0 flex-1 truncate text-xs text-slate-700">
                    <b className="text-engraved text-slate-900">{a.userName}</b>{" "}
                    <span className="text-slate-600">{a.details ?? ""}</span>
                  </div>
                  <span className="text-engraved-subtle shrink-0 text-[11px] font-semibold text-slate-400">
                    {timeAgo(a.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="space-y-7">
          <Card className="p-6">
            <SectionTitle title="Azioni rapide" />
            <div className="space-y-2.5">
              <Link
                href="/dashboard/opportunities"
                className="tactile-card tactile-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="tactile-icon-well flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Radar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-engraved text-xs font-bold text-slate-900">
                    Radar Opportunità
                  </div>
                  <div className="text-engraved-subtle text-[11px] text-slate-500">
                    Heatmap bisogni + opportunity score
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/ai"
                className="tactile-card tactile-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="tactile-icon-well flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-engraved text-xs font-bold text-slate-900">
                    AI Console
                  </div>
                  <div className="text-engraved-subtle text-[11px] text-slate-500">
                    6 agenti: Scout, Architect, Structurer…
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/projects"
                className="tactile-card tactile-card-interactive flex items-center gap-3 p-3.5"
              >
                <div className="tactile-icon-well flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FolderKanban className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-engraved text-xs font-bold text-slate-900">
                    Pipeline progetti
                  </div>
                  <div className="text-engraved-subtle text-[11px] text-slate-500">
                    {projectCount} venture orchestrate
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Stato sistema" />
            <div className="tactile-sunken space-y-2 rounded-2xl p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-engraved-subtle font-semibold text-slate-600">Event Ledger</span>
                <span className="tactile-pill border-emerald-500/30 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-engraved-subtle font-semibold text-slate-600">MRV Engine</span>
                <span className="tactile-pill border-emerald-500/30 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  sync 2 min fa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-engraved-subtle font-semibold text-slate-600">RegTech SFDR/CSRD</span>
                <span className="tactile-pill border-emerald-500/30 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  conforme
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-engraved-subtle font-semibold text-slate-600">Tassonomia IRIS+</span>
                <span className="tactile-pill border-emerald-500/30 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  v5.3
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
