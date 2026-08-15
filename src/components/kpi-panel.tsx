"use client";

import { useState } from "react";
import { AlertTriangle, Bot, ChevronDown, ChevronRight, Plus, Target, Trash2 } from "lucide-react";
import type { KpiDTO, ProjectDTO } from "@/lib/types";
import { computeFinance, computeSroi, kpiProgress, sroiSocialValue } from "@/lib/finance";
import { addEvidence, addKpi, removeKpi, runAgent, validateEvidence } from "@/actions";
import type { AgentResult } from "@/lib/agents";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtEUR, fmtNum, fmtPct, timeAgo } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, EmptyState, Field, inputCls, ProgressBar, SectionTitle } from "@/components/ui";

const KPI_CATALOG = [
  { code: "PI4069", title: "Posti di lavoro stabili creati", unit: "FTE", valuePerUnit: 28000, sdg: "SDG 8" },
  { code: "PI1309", title: "Persone in povertà servite", unit: "n.", valuePerUnit: 1200, sdg: "SDG 1" },
  { code: "PI8835", title: "Inserimenti lavorativi", unit: "n.", valuePerUnit: 30000, sdg: "SDG 8" },
  { code: "PI1794", title: "Energia rinnovabile prodotta", unit: "MWh/anno", valuePerUnit: 150, sdg: "SDG 7" },
  { code: "PI9913", title: "CO2 evitata", unit: "t/anno", valuePerUnit: 120, sdg: "SDG 13" },
  { code: "PI1333", title: "Beneficiari serviti", unit: "n.", valuePerUnit: 8000, sdg: "SDG 3" },
  { code: "PI4871", title: "Studenti formati", unit: "n.", valuePerUnit: 8000, sdg: "SDG 4" },
];

const EVIDENCE_TYPES = ["DOCUMENT", "API_PAYROLL", "TIMESHEET", "IOT", "SURVEY", "SENTIMENT"];

function EvidenceRow({ project, kpi }: { project: ProjectDTO; kpi: KpiDTO }) {
  const { user, users, setUserId } = useRole();
  const canSubmit = hasPerm(user.role, "evidence.submit");
  const canValidate = hasPerm(user.role, "evidence.validate");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "DOCUMENT", value: "" });
  const [auditNotes, setAuditNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const auditorUser = users.find((u) => u.role === "AUDITOR");
  const evidences = project.evidences.filter((e) => e.kpiId === kpi.id);

  const handleValidate = async (evidenceId: number, decision: "APPROVED" | "REJECTED") => {
    setBusyId(evidenceId);
    const note = auditNotes[evidenceId]?.trim() || (decision === "APPROVED" ? "Evidenza conforme e verificata dall'Auditor." : "Evidenza respinta per mancata rispondenza ai requisiti.");
    await validateEvidence(evidenceId, decision, note, user.id);
    setBusyId(null);
  };

  return (
    <div>
      <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {evidences.length} evidenze · {evidences.filter((e) => e.status === "APPROVED").length} approvate · {evidences.filter((e) => e.status === "PENDING").length} in attesa
      </button>

      {open && (
        <div className="mt-2 space-y-2 pl-4">
          {evidences.map((e) => (
            <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-800">{e.title}</div>
                  <div className="text-[10px] text-slate-400">
                    Tipo: <b>{e.type}</b> · Valore: <b className="text-slate-700">{fmtNum(e.value)}</b> · Inviata da: {e.submittedByName ?? "Implementer"} · {timeAgo(e.submittedAt)}
                  </div>
                </div>
                <Badge
                  className={
                    e.status === "APPROVED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : e.status === "REJECTED"
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {e.status === "APPROVED" ? "✓ Approvata" : e.status === "REJECTED" ? "✕ Respinta" : "⏳ In attesa di Audit"}
                </Badge>
              </div>

              {/* Giudizio dell'Auditor registrato */}
              {e.validatorNote && (
                <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-2 text-xs text-slate-700">
                  <span className="font-bold text-slate-800">👨‍⚖️ Giudizio / Nota Auditor:</span> {e.validatorNote}
                </div>
              )}

              {/* Box di Valutazione per l'Auditor (se evidenza PENDING) */}
              {e.status === "PENDING" && (
                <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/40 p-2.5">
                  {canValidate ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-amber-900">
                        👨‍⚖️ Valutazione Auditor ({user.name} — {user.role}):
                      </div>
                      <input
                        value={auditNotes[e.id] ?? ""}
                        onChange={(ev) => setAuditNotes({ ...auditNotes, [e.id]: ev.target.value })}
                        placeholder="Inserisci qui il giudizio o motivazione di conformità dell'Auditor…"
                        className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs outline-none focus:border-amber-500 shadow-xs"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === e.id}
                          className="rounded-md border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          onClick={() => handleValidate(e.id, "REJECTED")}
                        >
                          ✕ Respingi Evidenza
                        </button>
                        <button
                          type="button"
                          disabled={busyId === e.id}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          onClick={() => handleValidate(e.id, "APPROVED")}
                        >
                          ✓ Approva con Giudizio
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-800">
                      <span>🔒 La validazione formale dell'evidenza è riservata al ruolo <b>Auditor</b> (o PA Validatore / Super Admin).</span>
                      {auditorUser && (
                        <button
                          type="button"
                          onClick={() => setUserId(auditorUser.id)}
                          className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300 shadow-xs hover:bg-amber-100"
                        >
                          Passa a Marco Bellini (Auditor)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {canSubmit && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 p-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titolo evidenza (es. buste paga Q2)"
                className={cn(inputCls, "min-w-40 flex-1")}
              />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={cn(inputCls, "w-36")}>
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="valore"
                className={cn(inputCls, "w-24")}
              />
              <button
                className={btnSecondary}
                onClick={async () => {
                  if (!form.title || !form.value) return;
                  await addEvidence(kpi.id, { title: form.title, type: form.type, value: Number(form.value) }, user.id);
                  setForm({ title: "", type: "DOCUMENT", value: "" });
                }}
              >
                <Plus className="h-4 w-4" /> Invia
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KpiPanel({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canSubmit = hasPerm(user.role, "kpi.submit") || hasPerm(user.role, "project.edit");
  const canManageKpi = canSubmit;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: KPI_CATALOG[0].code,
    title: KPI_CATALOG[0].title,
    unit: KPI_CATALOG[0].unit,
    baseline: "0",
    target: "",
    valuePerUnit: String(KPI_CATALOG[0].valuePerUnit),
    verificationMethod: "",
    sdg: KPI_CATALOG[0].sdg,
  });
  const [result, setResult] = useState<AgentResult | null>(null);
  const [busy, setBusy] = useState(false);

  const f = computeFinance(project.tranches, project);
  const sroi = computeSroi(project.kpis, f.total);
  const socialValue = sroiSocialValue(project.kpis);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SROI dinamico (RF-08.3)</div>
          <div className={cn("mt-1 text-3xl font-black", sroi >= 1 ? "text-emerald-600" : "text-rose-500")}>
            {sroi.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Valore sociale monetizzato 5 anni ÷ funding totale</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valore sociale monetizzato</div>
          <div className="mt-1 text-3xl font-black text-slate-900">{fmtEUR(socialValue)}</div>
          <p className="mt-1 text-[11px] text-slate-400">Σ (valore attuale × proxy €/unità) × 5 anni</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">KPI monitorati</div>
            <button className={btnSecondary} onClick={async () => {
              setBusy(true);
              setResult(await runAgent("mrv", { projectId: project.id }, user.id));
              setBusy(false);
            }}>
              <Bot className="h-4 w-4 text-violet-500" /> {busy ? "Analisi…" : "MRV Agent"}
            </button>
          </div>
          <div className="mt-1 text-3xl font-black text-slate-900">{project.kpis.length}</div>
          <p className="mt-1 text-[11px] text-slate-400">{project.kpis.filter((k) => k.verificationMethod).length} con metodo di verifica definito</p>
        </Card>
      </div>

      {result && (
        <Card className="border-violet-200 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-violet-700">
            <Bot className="h-4 w-4" /> {result.title}
          </div>
          <p className="mb-3 text-sm text-slate-600">{result.summary}</p>
          <div className="space-y-2">
            {result.steps.map((st, i) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-700">{st.text}</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-500">📚 {st.source}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <SectionTitle
          title="KPI — tassonomia IRIS+ / BES / SDG"
          subtitle="RF-08.1: baseline, target, fonte di verifica per ogni KPI"
          right={
            canSubmit && (
              <button className={btnPrimary} onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4" /> Nuovo KPI
              </button>
            )
          }
        />

        {showForm && (
          <div className="mb-4 rounded-lg border border-dashed border-slate-300 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              <Field label="KPI (catalogo)">
                <select
                  className={inputCls}
                  value={form.code}
                  onChange={(e) => {
                    const cat = KPI_CATALOG.find((k) => k.code === e.target.value);
                    if (cat) setForm({ ...form, code: cat.code, title: cat.title, unit: cat.unit, valuePerUnit: String(cat.valuePerUnit), sdg: cat.sdg });
                  }}
                >
                  {KPI_CATALOG.map((k) => (
                    <option key={k.code} value={k.code}>
                      {k.code} — {k.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Titolo">
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Unità">
                <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </Field>
              <Field label="Baseline">
                <input type="number" className={inputCls} value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
              </Field>
              <Field label="Target">
                <input type="number" className={inputCls} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </Field>
              <Field label="Proxy €/unità (SROI)">
                <input type="number" className={inputCls} value={form.valuePerUnit} onChange={(e) => setForm({ ...form, valuePerUnit: e.target.value })} />
              </Field>
              <div className="md:col-span-3">
                <Field label="Metodo di verifica">
                  <input className={inputCls} value={form.verificationMethod} onChange={(e) => setForm({ ...form, verificationMethod: e.target.value })} placeholder="es. Buste paga (API anonimizzate)" />
                </Field>
              </div>
            </div>
            <button
              className={cn(btnPrimary, "mt-3")}
              onClick={async () => {
                if (!form.title || !form.target) return;
                await addKpi(
                  project.id,
                  {
                    code: form.code,
                    title: form.title,
                    unit: form.unit,
                    baseline: Number(form.baseline) || 0,
                    target: Number(form.target),
                    valuePerUnit: Number(form.valuePerUnit) || 0,
                    verificationMethod: form.verificationMethod,
                    sdg: form.sdg,
                  },
                  user.id
                );
                setShowForm(false);
              }}
            >
              Salva KPI
            </button>
          </div>
        )}

        {project.kpis.length === 0 ? (
          <EmptyState icon={<Target className="h-6 w-6 text-slate-300" />} text="Nessun KPI definito per questo progetto" />
        ) : (
          <div className="space-y-3">
            {project.kpis.map((k) => {
              const prog = kpiProgress(k);
              return (
                <div key={k.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-800">{k.title}</span>
                        <Badge className="border-slate-200 bg-slate-50 text-slate-500">{k.code}</Badge>
                        {k.sdg && <Badge className="border-sky-200 bg-sky-50 text-sky-700">{k.sdg}</Badge>}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        baseline {fmtNum(k.baseline)} {k.unit} → target {fmtNum(k.target)} {k.unit} · attuale{" "}
                        <b className="text-slate-600">{fmtNum(k.current)} {k.unit}</b>
                        {" · "}verifica: {k.verificationMethod ?? "non definita"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28">
                        <ProgressBar value={prog * 100} />
                        <div className="mt-0.5 text-right text-[10px] font-bold text-slate-500">{fmtPct(prog * 100, 0)}</div>
                      </div>
                      {canManageKpi && (
                        <button
                          type="button"
                          onClick={() => removeKpi(k.id, user.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                          title="Elimina questo KPI"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <EvidenceRow project={project} kpi={k} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
