"use client";

import { useState } from "react";
import {
  BadgeEuro,
  Coins,
  FileText,
  Gauge,
  LayoutPanelTop,
  MapPin,
  Plus,
  Target,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import type { ProjectDTO, UserDTO } from "@/lib/types";
import { STATUS_BADGE, STATUS_LABEL, bancabilityChecks } from "@/lib/workflow";
import { computeFinance } from "@/lib/finance";
import { addStakeholder, removeStakeholder } from "@/actions";
import { useRole } from "@/components/role-provider";
import { hasPerm, ROLE_LABELS, STAKEHOLDER_LABELS } from "@/lib/permissions";
import { cn, fmtEURCompact, fmtNum } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, CheckItem, Field, inputCls, SectionTitle, StatusBadge } from "@/components/ui";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { TocCanvas } from "@/components/toc-canvas";
import { FinanceBuilder } from "@/components/finance-builder";
import { UnderwritingPanel } from "@/components/underwriting-panel";
import { KpiPanel } from "@/components/kpi-panel";
import { WalletPanel } from "@/components/wallet-panel";
import { DealRoom } from "@/components/deal-room";

const TABS = [
  { key: "overview", label: "Panoramica", icon: LayoutPanelTop, perm: "project.view" },
  { key: "finance", label: "Struttura Finanziaria", icon: BadgeEuro, perm: "project.view" },
  { key: "underwriting", label: "Underwriting", icon: Gauge, perm: "project.view" },
  { key: "kpi", label: "KPI & MRV", icon: Target, perm: "project.view" },
  { key: "wallet", label: "Wallet & Token", icon: Wallet, perm: "project.view" },
  { key: "dealroom", label: "Deal Room", icon: FileText, perm: "project.view" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function Stakeholders({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canManage = hasPerm(user.role, "stakeholder.manage");
  const [form, setForm] = useState({
    type: "ETS_IMPLEMENTER",
    orgName: "",
    commitment: "",
  });

  return (
    <Card className="p-4">
      <SectionTitle
        title={`Stakeholder — ${project.stakeholders.length}`}
        subtitle="RF-02.2 · tipologie coinvolte (ACL per progetto)"
      />
      <div className="flex flex-wrap gap-2">
        {project.stakeholders.map((st) => (
          <div key={st.id} className="group relative flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
            <Users className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-xs font-bold text-slate-800">{st.orgName}</div>
              <div className="text-[10px] text-slate-400">
                {STAKEHOLDER_LABELS[st.type] ?? st.type}
                {st.commitment && ` · ${st.commitment}`}
              </div>
            </div>
            {st.commitmentValue > 0 && (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{fmtEURCompact(st.commitmentValue)}</Badge>
            )}
            {canManage && (
              <button
                onClick={() => removeStakeholder(st.id, user.id)}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow group-hover:flex"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-slate-300 p-3">
          <div className="w-44">
            <Field label="Tipologia">
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(ROLE_LABELS)
                  .filter(([k]) => !["SUPER_ADMIN", "TERRITORIAL_ANALYST", "ORIGINATOR", "AUDITOR"].includes(k))
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <div className="min-w-44 flex-1">
            <Field label="Organizzazione">
              <input className={inputCls} value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} placeholder="es. Comune di …" />
            </Field>
          </div>
          <div className="min-w-44 flex-1">
            <Field label="Commitment">
              <input className={inputCls} value={form.commitment} onChange={(e) => setForm({ ...form, commitment: e.target.value })} placeholder="es. Comodato immobile" />
            </Field>
          </div>
          <button
            className={btnPrimary}
            onClick={async () => {
              if (!form.orgName.trim()) return;
              await addStakeholder(
                project.id,
                { type: form.type as ProjectDTO["stakeholders"][number]["type"], orgName: form.orgName, commitment: form.commitment || undefined },
                user.id
              );
              setForm({ type: "ETS_IMPLEMENTER", orgName: "", commitment: "" });
            }}
          >
            <Plus className="h-4 w-4" /> Invita
          </button>
        </div>
      )}
    </Card>
  );
}

function Overview({ project }: { project: ProjectDTO }) {
  const f = computeFinance(project.tranches, project);
  const checks = bancabilityChecks(project);
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-5">
      <WorkflowStepper project={project} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            title="Criteri di bancabilità"
            subtitle="RF-10 — un progetto è 'bancabile e lanciato' quando…"
            right={<Badge className={passedCount === 5 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{passedCount}/5 superati</Badge>}
          />
          <div>
            {checks.map((c) => (
              <CheckItem key={c.label} label={c.label} passed={c.passed} hint={c.hint} />
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <SectionTitle title="Impatto economico locale (RF-07)" />
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Local Multiplier LM3</span>
                  <b className="text-slate-800">{(project.lm3 * 100).toFixed(0)}%</b>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.lm3 * 100}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">€ che restano nel raggio di 50 km per ogni € speso</p>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Approvvigionamento locale</span>
                <b className="text-slate-800">{fmtNum(project.localSupplierPct, 0)}%</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">FTE creati</span>
                <b className="text-slate-800">{project.fteCreated}</b>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="Copertura fabbisogno" />
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Fabbisogno</span><b>{fmtEURCompact(project.fundingNeed)}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Strutturato</span><b>{fmtEURCompact(f.total)}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Leva</span><b>{f.leverage.toFixed(1)}x</b></div>
            </div>
          </Card>
        </div>
      </div>

      {project.description && (
        <Card className="p-4">
          <SectionTitle title="Descrizione" />
          <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
        </Card>
      )}

      <Stakeholders project={project} />
    </div>
  );
}

export function ProjectDetail({ project, users }: { project: ProjectDTO; users: UserDTO[] }) {
  const { user } = useRole();
  const [tab, setTab] = useState<TabKey>("overview");

  const visibleTabs = TABS.filter((t) => hasPerm(user.role, t.perm));

  return (
    <div className="space-y-5">
      {/* Header progetto */}
      <div className="tactile-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-engraved text-2xl font-black text-slate-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.tagline && <p className="text-engraved-subtle mt-1.5 text-sm font-medium text-slate-600">{project.tagline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="tactile-pill flex items-center gap-1.5 bg-white px-2.5 py-1 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {project.territory}{project.commune ? ` · ${project.commune}` : ""}
              </span>
              <span className="tactile-pill flex items-center gap-1.5 bg-white px-2.5 py-1 text-slate-700">
                <Users className="h-3.5 w-3.5 text-sky-600" /> {project.stakeholders.length} stakeholder
              </span>
              <span className="tactile-pill flex items-center gap-1.5 bg-white px-2.5 py-1 text-slate-700">
                <Coins className="h-3.5 w-3.5 text-amber-600" /> {fmtEURCompact(computeFinance(project.tranches, project).total)}
              </span>
              <span className="tactile-pill flex items-center gap-1.5 bg-white px-2.5 py-1 text-slate-700">
                <Target className="h-3.5 w-3.5 text-violet-600" /> {project.kpis.length} KPI
              </span>
              {project.originatorName && (
                <span className="text-engraved-subtle text-[11px] font-semibold text-slate-500">
                  originato da <b className="text-slate-800">{project.originatorName}</b>
                </span>
              )}
            </div>
          </div>
          {project.sdgTags && (
            <div className="flex flex-wrap gap-1.5">
              {project.sdgTags.map((tag) => (
                <Badge key={tag} className="border-sky-300/40 bg-gradient-to-b from-sky-50 to-sky-100 font-black text-sky-800">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs con Pozzetto Tattile */}
      <div className="tactile-sunken flex flex-wrap gap-1.5 rounded-2xl p-1.5">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              tab === t.key
                ? "tactile-btn-primary text-white"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            )}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenuto */}
      {tab === "overview" && <Overview project={project} />}
      {tab === "finance" && <FinanceBuilder key={project.updatedAt} project={project} />}
      {tab === "underwriting" && <UnderwritingPanel key={project.updatedAt} project={project} />}
      {tab === "kpi" && <KpiPanel key={project.updatedAt} project={project} />}
      {tab === "wallet" && <WalletPanel key={project.updatedAt} project={project} />}
      {tab === "dealroom" && <DealRoom key={project.updatedAt} project={project} />}

      {tab === "overview" && <TocCanvas key={project.updatedAt} project={project} />}
    </div>
  );
}
