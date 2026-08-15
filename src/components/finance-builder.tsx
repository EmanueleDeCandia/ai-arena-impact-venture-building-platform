"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  Coins,
  FileCheck2,
  Landmark,
  Percent,
  Plus,
  Save,
  Scale,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { Instrument } from "@/db/schema";
import type { ProjectDTO } from "@/lib/types";
import {
  annuity,
  breakEvenYears,
  calculateOutcomeValuation,
  computeFinance,
  computePayForSuccess,
  INSTRUMENT_META,
} from "@/lib/finance";
import {
  addTranche,
  applyAgentProposal,
  enablePayForSuccess,
  removeTranche,
  runAgent,
  saveOutcomeValuation,
  updateFinanceAssumptions,
} from "@/actions";
import type { AgentResult } from "@/lib/agents";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtEUR, fmtEURCompact, fmtNum, fmtPct } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, Field, inputCls, Modal, SectionTitle, Stat } from "@/components/ui";

const INSTRUMENTS = Object.entries(INSTRUMENT_META) as [Instrument, (typeof INSTRUMENT_META)[Instrument]][];

export function FinanceBuilder({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canEdit = hasPerm(user.role, "finance.edit");
  const f = computeFinance(project.tranches, project);
  const pfs = computePayForSuccess(project);

  const [showValuationForm, setShowValuationForm] = useState(false);
  const [valSaving, setValSaving] = useState(false);
  const [valSavedOk, setValSavedOk] = useState(false);

  const [pfsModalOpen, setPfsModalOpen] = useState(false);
  const [pfsModalBusy, setPfsModalBusy] = useState(false);
  const [pfsEnableForm, setPfsEnableForm] = useState({
    payer: "Comune / Fondazione Territoriale",
    budget: 200000,
    targetUnits: 50,
    kpiId: project.kpis.length > 0 ? String(project.kpis[0].id) : "",
    newKpiTitle: "",
    newKpiUnit: "persone",
    valuePerUnit: 3000,
  });

  const [valuationInput, setValuationInput] = useState({
    years: 5,
    publicSavingsYearly: 4000,
    fiscalRevenuesYearly: 1500,
    privateBenefitsYearly: 500,
    decayRatePct: 0,
    evidenceType: "Dati Amministrativi Ufficiali (INPS / ISTAT / MEF)",
    methodologyNotes: "Stima controfattuale basata su minori ammortizzatori sociali (NASpI) e maggior gettito IRPEF/INPS su orizzonte 5 anni",
  });

  const [form, setForm] = useState({
    instrument: "GRANT" as Instrument,
    label: "",
    provider: "",
    amount: "",
    ratePct: "",
    maturityMonths: "",
    conditions: "",
    kpiRefId: "",
    targetUnits: "",
  });
  const [assumptions, setAssumptions] = useState({
    fundingNeed: project.fundingNeed,
    annualRevenue: project.annualRevenue,
    annualOpex: project.annualOpex,
  });
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);

  const fundingTranches = project.tranches.filter((t) => t.instrument !== "GUARANTEE");
  const guaranteeOver = project.tranches.some((t) => t.instrument === "GUARANTEE" && t.guaranteePct > 80);

  const runStructurer = async () => {
    setAgentBusy(true);
    const res = await runAgent("structurer", { projectId: project.id }, user.id);
    setAgentResult(res);
    setAgentBusy(false);
  };

  const add = async () => {
    const amount = Number(form.amount);
    if (!form.label || !amount || amount <= 0) return;
    await addTranche(
      project.id,
      {
        instrument: form.instrument,
        label: form.label,
        provider: form.provider || undefined,
        amount,
        ratePct: Number(form.ratePct) || 0,
        maturityMonths: Number(form.maturityMonths) || 0,
        conditions: form.conditions || undefined,
        waterfallOrder: fundingTranches.length + 1,
      },
      user.id
    );
    setForm({ ...form, label: "", provider: "", amount: "", ratePct: "", maturityMonths: "", conditions: "" });
  };

  return (
    <div className="space-y-5">
      {/* Statistiche simulatore */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Funding totale" value={fmtEURCompact(f.total)} sub={`${fmtNum(project.tranches.length)} tranche`} icon={<Coins className="h-4 w-4" />} />
        <Stat label="Leva finanziaria" value={`${f.leverage.toFixed(1)}x`} sub="target ≥ 2x" icon={<TrendingUp className="h-4 w-4" />} accent="bg-sky-50 text-sky-600" />
        <Stat label="WACC blended" value={fmtPct(f.wacc * 100, 1)} sub="costo medio capitale" icon={<Percent className="h-4 w-4" />} accent="bg-violet-50 text-violet-600" />
        <Stat label="DSCR" value={f.dscr.toFixed(2)} sub={`NOI ${fmtEURCompact(f.noi)}/anno`} icon={<Landmark className="h-4 w-4" />} accent="bg-amber-50 text-amber-600" />
        <Stat label="Garanzia attiva" value={fmtEURCompact(f.guarantee)} sub={`max ${f.maxGuaranteePct}%`} icon={<ArrowRight className="h-4 w-4" />} accent="bg-rose-50 text-rose-600" />
      </div>

      {guaranteeOver && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          Vincolo violato (RF-04.5): la garanzia MCC/FEI non può superare l'80% del debito garantito.
        </div>
      )}

      {/* Waterfall */}
      <Card className="p-4">
        <SectionTitle
          title="Waterfall — struttura per tranche"
          subtitle="Ordine di rimborso secondo waterfallOrder"
          right={
            canEdit && (
              <button className={btnSecondary} onClick={runStructurer} disabled={agentBusy}>
                <Bot className="h-4 w-4 text-violet-500" />
                {agentBusy ? "Analisi…" : "Proponi struttura (Structurer Agent)"}
              </button>
            )
          }
        />
        <div className="flex h-12 w-full overflow-hidden rounded-lg border border-slate-200">
          {fundingTranches.length === 0 && (
            <div className="flex w-full items-center justify-center bg-slate-50 text-xs text-slate-400">Nessuna tranche</div>
          )}
          {fundingTranches.map((t) => (
            <div
              key={t.id}
              className={cn("flex items-center justify-center text-[10px] font-bold text-white transition-all", INSTRUMENT_META[t.instrument].bar)}
              style={{ width: `${f.total > 0 ? (t.amount / f.total) * 100 : 0}%` }}
              title={`${t.label} — ${fmtEUR(t.amount)} (${((t.amount / Math.max(1, f.total)) * 100).toFixed(0)}%)`}
            >
              {t.amount / Math.max(1, f.total) > 0.12 ? `${INSTRUMENT_META[t.instrument].short} ${((t.amount / f.total) * 100).toFixed(0)}%` : ""}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {fundingTranches.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={cn("h-2 w-2 rounded-full", INSTRUMENT_META[t.instrument].bar)} />
              {t.label} · {fmtEURCompact(t.amount)}
            </span>
          ))}
        </div>

        {/* Ammortamento */}
        {f.amortization.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Piano ammortamento (rata annua)</div>
            <table className="mt-2 w-full text-xs">
              <tbody>
                {f.amortization.slice(0, 12).map((a, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-500">{a.label}</td>
                    <td className="py-1.5 pr-3 text-slate-400">anno {a.year}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{fmtEUR(a.payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Risultato agent */}
      {agentResult && (
        <Card className="border-violet-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
              <Bot className="h-4 w-4" /> {agentResult.title}
            </div>
            {canEdit && (
              <button
                className={btnPrimary}
                onClick={async () => {
                  await applyAgentProposal(project.id, "structurer", user.id);
                  setAgentResult(null);
                }}
              >
                Applica struttura proposta
              </button>
            )}
          </div>
          <p className="mb-3 text-sm text-slate-600">{agentResult.summary}</p>
          <div className="space-y-2">
            {agentResult.steps.map((st: { text: string; source?: string }, i: number) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-700">{st.text}</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-500">📚 {st.source}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Tranche */}
        <Card className="p-4 lg:col-span-3">
          <SectionTitle title="Tranche" subtitle="RF-04.1 catalogo strumenti" />
          <div className="space-y-2">
            {project.tranches.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <Badge className={INSTRUMENT_META[t.instrument].badge}>{INSTRUMENT_META[t.instrument].label}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{t.label}</div>
                  <div className="truncate text-[11px] text-slate-400">
                    {t.provider ?? "—"}
                    {t.ratePct > 0 && ` · tasso ${t.ratePct}%`}
                    {t.maturityMonths > 0 && ` · ${Math.round(t.maturityMonths / 12)} anni`}
                    {t.guaranteePct > 0 && ` · garantita ${t.guaranteePct}%`}
                    {t.conditions && ` · condizione: ${t.conditions}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{fmtEURCompact(t.amount)}</div>
                  <div className="text-[10px] text-slate-400">ordine {t.waterfallOrder} · {t.status}</div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => removeTranche(t.id, user.id)}
                    className="rounded p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Aggiungi tranche</div>
              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Strumento">
                  <select
                    value={form.instrument}
                    onChange={(e) => {
                      const inst = e.target.value as Instrument;
                      if (inst === "SIB") {
                        setForm({
                          ...form,
                          instrument: inst,
                          label: form.label || "Contratto Pay for Success (Outcome Payment)",
                          provider: form.provider || "Outcome Payer (PA / Fondazione)",
                          ratePct: "0",
                          maturityMonths: "36",
                        });
                      } else {
                        setForm({ ...form, instrument: inst });
                      }
                    }}
                    className={inputCls}
                  >
                    {INSTRUMENTS.map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.instrument === "SIB" ? (
                  <>
                    <Field label="Etichetta Contratto">
                      <input
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        placeholder="Contratto Pay for Success"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Outcome Payer (Committente)">
                      <input
                        value={form.provider}
                        onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        placeholder="es. Comune di Taranto / Fondazione Cariplo"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Plafond Outcome Payment (€)">
                      <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="200000"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="KPI / Outcome Target Collegato">
                      <select
                        className={inputCls}
                        value={form.kpiRefId}
                        onChange={(e) => {
                          const kId = e.target.value;
                          const selectedKpi = project.kpis.find((k) => String(k.id) === kId);
                          setForm({
                            ...form,
                            kpiRefId: kId,
                            targetUnits: selectedKpi ? String(selectedKpi.target) : form.targetUnits,
                            conditions: selectedKpi ? `Outcome verificato: kpi:${selectedKpi.id} >= ${selectedKpi.target}` : form.conditions,
                          });
                        }}
                      >
                        <option value="">— Seleziona KPI del progetto —</option>
                        {project.kpis.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.code}: {k.title} (Target: {k.target} {k.unit})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Target Minimo Outcome (Unità)">
                      <input
                        type="number"
                        value={form.targetUnits}
                        onChange={(e) => setForm({ ...form, targetUnits: e.target.value })}
                        placeholder="50"
                        className={inputCls}
                      />
                    </Field>
                    <div className="md:col-span-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 p-2.5 text-xs text-fuchsia-950">
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-fuchsia-600" />
                        Condizione di Liquidazione a Risultato
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-fuchsia-800">
                        <span>Condizione registrata:</span>
                        <code className="bg-white/80 px-2 py-0.5 rounded border border-fuchsia-200 font-mono text-[10px]">
                          {form.conditions || (form.kpiRefId ? `kpi:${form.kpiRefId} >= ${form.targetUnits || 1}` : "Condizione standard")}
                        </code>
                      </div>
                      {Number(form.amount) > 0 && Number(form.targetUnits) > 0 && (
                        <div className="mt-1 text-[11px] font-bold text-fuchsia-900">
                          Costo Unitario Outcome: {fmtEUR(Math.round(Number(form.amount) / Number(form.targetUnits)))} / unità
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Etichetta / nome tranche">
                      <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="es. Debito senior" className={inputCls} />
                    </Field>
                    <Field label="Importo (€)">
                      <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500000" className={inputCls} />
                    </Field>
                    <Field label="Provider">
                      <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Banca / Fondo / Fondazione" className={inputCls} />
                    </Field>
                    <Field label="Tasso %">
                      <input type="number" step="0.1" value={form.ratePct} onChange={(e) => setForm({ ...form, ratePct: e.target.value })} placeholder="6.5" className={inputCls} />
                    </Field>
                    <Field label="Durata (mesi)">
                      <input type="number" value={form.maturityMonths} onChange={(e) => setForm({ ...form, maturityMonths: e.target.value })} placeholder="120" className={inputCls} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Condizioni di erogazione (RF-06.4 conditional disbursement)">
                        <input value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="es. Milestone 1 completata" className={inputCls} />
                      </Field>
                    </div>
                  </>
                )}
              </div>
              <button className={cn(btnPrimary, "mt-3")} onClick={add}>
                <Plus className="h-4 w-4" /> Aggiungi tranche
              </button>
            </div>
          )}
        </Card>

        {/* Assunzioni & Pannelli Analisi */}
        <div className="space-y-5 lg:col-span-2">
          {/* Pay for Success / SIB Engine */}
          {pfs.hasPfs && (
            <Card className="border-fuchsia-200 bg-fuchsia-50/30 p-4">
              <SectionTitle
                title="Pay for Success & SIB Engine"
                subtitle={`Contratto a risultato con ${pfs.payerName}`}
                right={
                  <Badge className={pfs.conditionMet ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800"}>
                    {pfs.conditionMet ? "✓ Target Raggiunto" : `⏳ In corso (${pfs.progressPct}%)`}
                  </Badge>
                }
              />
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-fuchsia-100 bg-white p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Plafond Outcome Payment</div>
                    <div className="text-base font-black text-fuchsia-700">{fmtEUR(pfs.maxOutcomeBudget)}</div>
                    <div className="text-[10px] text-slate-500">{pfs.payerName}</div>
                  </div>
                  <div className="rounded-lg border border-fuchsia-100 bg-white p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Costo Unitario Outcome</div>
                    <div className="text-base font-black text-slate-900">{fmtEUR(pfs.costPerOutcome)}</div>
                    <div className="text-[10px] text-slate-500">Plafond ÷ Target ({pfs.targetUnits} {pfs.linkedKpi?.unit ?? "n."})</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Valore Netto Outcome (unitario)</div>
                    <div className={cn("text-base font-black", pfs.netUnitOutcomeValue >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {fmtEUR(pfs.netUnitOutcomeValue)}
                    </div>
                    <div className="text-[10px] text-slate-400">Surplus netto per unità</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Valore Sociale Unitario</div>
                    <div className="text-base font-bold text-slate-800">{fmtEUR(pfs.socialValuePerUnit)}</div>
                    <div className="text-[10px] text-slate-400">Lordo (BCR: {pfs.bcr}x)</div>
                  </div>
                </div>

                <div className="rounded-lg border border-fuchsia-200 bg-white p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Avanzamento Outcome Target</div>
                      <div className="text-[10px] text-slate-500">
                        {pfs.linkedKpi?.title ?? "KPI di riferimento"}: <b>{pfs.currentUnits}</b> / {pfs.targetUnits} {pfs.linkedKpi?.unit ?? ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-fuchsia-700">{fmtEUR(pfs.unlockedPayment)}</div>
                      <div className="text-[10px] text-slate-400">Maturato a risultato</div>
                    </div>
                  </div>
                </div>

                {/* Toggle Calcolatore Valore Netto */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowValuationForm(!showValuationForm)}
                    className="flex w-full items-center justify-between rounded-lg border border-fuchsia-200 bg-white px-3 py-2 text-left text-xs font-semibold text-fuchsia-900 shadow-sm hover:bg-fuchsia-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-fuchsia-600" />
                      <span>{showValuationForm ? "Nascondi Calcolatore Valore Netto" : "🔬 Calcola e Certifica Valore Netto dell'Outcome"}</span>
                    </div>
                    <Badge className="border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 text-[10px]">Stima Controfattuale</Badge>
                  </button>
                </div>

                {/* Form di Stima Controfattuale e Certificazione */}
                {showValuationForm && (
                  <div className="mt-2 space-y-3 rounded-lg border border-fuchsia-200 bg-white p-3.5 text-xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 font-bold text-slate-900">
                      <Scale className="h-4 w-4 text-fuchsia-600" />
                      Parametri di Stima Controfattuale dell'Outcome
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Orizzonte temporale (anni)">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={valuationInput.years}
                          onChange={(e) => setValuationInput({ ...valuationInput, years: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Decadimento annuo (%)">
                        <input
                          type="number"
                          step="0.5"
                          value={valuationInput.decayRatePct}
                          onChange={(e) => setValuationInput({ ...valuationInput, decayRatePct: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <div className="space-y-2">
                      <Field label="Costi pubblici risparmiati (€/anno/unità)">
                        <input
                          type="number"
                          value={valuationInput.publicSavingsYearly}
                          onChange={(e) => setValuationInput({ ...valuationInput, publicSavingsYearly: Number(e.target.value) })}
                          placeholder="es. 4000 (NASpI, sussidi evitati)"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Entrate fiscali/contributive aggiuntive (€/anno/unità)">
                        <input
                          type="number"
                          value={valuationInput.fiscalRevenuesYearly}
                          onChange={(e) => setValuationInput({ ...valuationInput, fiscalRevenuesYearly: Number(e.target.value) })}
                          placeholder="es. 1500 (IRPEF, INPS versati)"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Benefici privati e sviluppo locale (€/anno/unità)">
                        <input
                          type="number"
                          value={valuationInput.privateBenefitsYearly}
                          onChange={(e) => setValuationInput({ ...valuationInput, privateBenefitsYearly: Number(e.target.value) })}
                          placeholder="es. 500 (spesa locale sul territorio)"
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      <Field label="Tipo di evidenza / base metodologica">
                        <select
                          value={valuationInput.evidenceType}
                          onChange={(e) => setValuationInput({ ...valuationInput, evidenceType: e.target.value })}
                          className={inputCls}
                        >
                          <option value="Dati Amministrativi Ufficiali (INPS / ISTAT / MEF)">Dati Amministrativi Ufficiali (INPS / ISTAT / MEF)</option>
                          <option value="Studio Scientifico Peer-Reviewed (RCT / Quasi-Sperimentale)">Studio Scientifico Peer-Reviewed (RCT / Quasi-Sperimentale)</option>
                          <option value="Benchmarking Amministrativo Territoriale / Studio di Settore">Benchmarking Amministrativo Territoriale / Studio di Settore</option>
                          <option value="Analisi Interna Certificata da Auditor Indipendente">Analisi Interna Certificata da Auditor Indipendente</option>
                        </select>
                      </Field>

                      <Field label="Note metodologiche & Riferimento Documenti Audit">
                        <textarea
                          rows={2}
                          value={valuationInput.methodologyNotes}
                          onChange={(e) => setValuationInput({ ...valuationInput, methodologyNotes: e.target.value })}
                          placeholder="Indicare fonti, estremi documenti allegati o parametri econometrici usati..."
                          className={cn(inputCls, "h-auto py-1.5")}
                        />
                      </Field>
                    </div>

                    {/* Calcolo Risultati Live */}
                    {(() => {
                      const valRes = calculateOutcomeValuation(valuationInput, pfs.costPerOutcome);
                      return (
                        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Valore Sociale Lordo ({valuationInput.years} anni):</span>
                            <b>{fmtEUR(valRes.grossValue)}/un.</b>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Costo Unitario Outcome (Attuatore):</span>
                            <span className="text-slate-600">{fmtEUR(pfs.costPerOutcome)}/un.</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-fuchsia-200/60 pt-1.5 font-bold text-emerald-800">
                            <span>Valore Netto dell'Outcome:</span>
                            <span className="text-sm">{fmtEUR(valRes.netValue)}/un. (BCR: {valRes.bcr}x)</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Risparmi PA: {fmtEUR(valRes.publicSavingsTotal)} · Fisco: {fmtEUR(valRes.fiscalRevenuesTotal)} · Sviluppo Locale: {fmtEUR(valRes.privateBenefitsTotal)}
                          </div>

                          {canEdit && pfs.linkedKpi && (
                            <button
                              type="button"
                              disabled={valSaving}
                              onClick={async () => {
                                setValSaving(true);
                                await saveOutcomeValuation(
                                  project.id,
                                  pfs.linkedKpi!.id,
                                  valRes.grossValue,
                                  valuationInput.methodologyNotes,
                                  valuationInput.evidenceType,
                                  user.id
                                );
                                setValSaving(false);
                                setValSavedOk(true);
                                setTimeout(() => setValSavedOk(false), 3000);
                              }}
                              className={cn(btnPrimary, "w-full mt-2 justify-center py-1.5 text-xs")}
                            >
                              {valSavedOk ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Stima Salvata nel KPI!
                                </>
                              ) : (
                                <>
                                  <FileCheck2 className="h-3.5 w-3.5" /> Salva & Certifica nel KPI di Progetto
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Se non ancora attivo: Card di Attivazione Rapida Pay for Success */}
          {!pfs.hasPfs && (
            <Card className="border-dashed border-fuchsia-300 bg-fuchsia-50/20 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-fuchsia-950 text-xs">
                    <Sparkles className="h-4 w-4 text-fuchsia-600" />
                    Finanziamento a Risultato (Pay for Success / SIB)
                  </div>
                  <Badge className="border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800 text-[10px]">Opzionale</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Un committente pubblico o investitore filantropico propone un contratto con pagamento condizionato a outcome? Attiva il modulo per calcolare costi, valore sociale e condizioni di sblocco.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setPfsModalOpen(true)}
                    className={cn(btnSecondary, "w-full justify-center border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-100 text-xs py-1.5")}
                  >
                    <Plus className="h-3.5 w-3.5" /> Attiva / Configura Pay for Success nel Progetto
                  </button>
                )}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <SectionTitle title="Assunzioni simulatore" subtitle="RF-04.3 — fabbisogno e conto economico" />
            <div className="space-y-3">
              <Field label="Fabbisogno (€)">
                <input type="number" value={assumptions.fundingNeed} disabled={!canEdit} onChange={(e) => setAssumptions({ ...assumptions, fundingNeed: Number(e.target.value) })} className={cn(inputCls, "disabled:bg-slate-50")} />
              </Field>
              <Field label="Ricavi annui (€)">
                <input type="number" value={assumptions.annualRevenue} disabled={!canEdit} onChange={(e) => setAssumptions({ ...assumptions, annualRevenue: Number(e.target.value) })} className={cn(inputCls, "disabled:bg-slate-50")} />
              </Field>
              <Field label="Costi operativi annui (€)">
                <input type="number" value={assumptions.annualOpex} disabled={!canEdit} onChange={(e) => setAssumptions({ ...assumptions, annualOpex: Number(e.target.value) })} className={cn(inputCls, "disabled:bg-slate-50")} />
              </Field>
              {canEdit && (
                <button className={btnPrimary} onClick={() => updateFinanceAssumptions(project.id, assumptions, user.id)}>
                  <Save className="h-4 w-4" /> Aggiorna assunzioni
                </button>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="Copertura fabbisogno" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Fabbisogno</span><b>{fmtEUR(project.fundingNeed)}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Funding strutturato</span><b>{fmtEUR(f.total)}</b></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Copertura</span>
                <b className={f.total >= project.fundingNeed ? "text-emerald-600" : "text-rose-500"}>
                  {project.fundingNeed > 0 ? Math.round((f.total / project.fundingNeed) * 100) : 0}%
                </b>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">Rata annua debito</span><b>{fmtEUR(f.debtService)}</b></div>
            </div>
          </Card>

          {/* Proiezione Payback / Break-Even */}
          <Card className="p-4">
            <SectionTitle title="Proiezione Payback (RF-07.4)" subtitle="Tempo di recupero capitale su NOI annuo" />
            {(() => {
              const be = breakEvenYears(project);
              return (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 p-2.5">
                    <div>
                      <div className="font-bold text-emerald-900">Payback con Grant</div>
                      <div className="text-[10px] text-emerald-700">Capitale privato (Totale - Grant) ÷ NOI</div>
                    </div>
                    <div className="text-base font-black text-emerald-700">
                      {be.withGrant !== null ? `${be.withGrant.toFixed(1)} anni` : "N/D (NOI ≤ 0)"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <div>
                      <div className="font-bold text-slate-800">Payback senza Grant</div>
                      <div className="text-[10px] text-slate-500">Funding totale 100% ÷ NOI</div>
                    </div>
                    <div className="text-base font-black text-slate-700">
                      {be.withoutGrant !== null ? `${be.withoutGrant.toFixed(1)} anni` : "N/D (NOI ≤ 0)"}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    NOI attuale: {fmtEUR(f.noi)}/anno (Ricavi {fmtEUR(project.annualRevenue)} - Opex {fmtEUR(project.annualOpex)})
                  </p>
                </div>
              );
            })()}
          </Card>
        </div>
      </div>

      {/* Modal di Attivazione Pay for Success su Progetto Esistente */}
      {pfsModalOpen && (
        <Modal title="Configura & Attiva Pay for Success / SIB" onClose={() => setPfsModalOpen(false)}>
          <div className="space-y-3 text-xs">
            <Field label="Outcome Payer (PA / Fondazione / Impresa Anchor)">
              <input
                className={inputCls}
                value={pfsEnableForm.payer}
                onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, payer: e.target.value })}
                placeholder="es. Comune di Milano / Fondazione Cariplo"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Plafond Outcome Payment (€)">
                <input
                  type="number"
                  className={inputCls}
                  value={pfsEnableForm.budget}
                  onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, budget: Number(e.target.value) })}
                  placeholder="200000"
                />
              </Field>
              <Field label="Target Outcome (Unità)">
                <input
                  type="number"
                  className={inputCls}
                  value={pfsEnableForm.targetUnits}
                  onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, targetUnits: Number(e.target.value) })}
                  placeholder="50"
                />
              </Field>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-2">
              <div className="font-bold text-slate-800">Collegamento KPI / Outcome di Riferimento</div>
              {project.kpis.length > 0 && (
                <Field label="Seleziona KPI esistente">
                  <select
                    className={inputCls}
                    value={pfsEnableForm.kpiId}
                    onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, kpiId: e.target.value })}
                  >
                    <option value="">— Crea un nuovo KPI —</option>
                    {project.kpis.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.code}: {k.title} (Target: {k.target} {k.unit})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {!pfsEnableForm.kpiId && (
                <div className="space-y-2 rounded-lg bg-slate-50 p-2.5">
                  <Field label="Titolo del Nuovo Outcome">
                    <input
                      className={inputCls}
                      value={pfsEnableForm.newKpiTitle}
                      onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, newKpiTitle: e.target.value })}
                      placeholder="es. Famiglie uscite dalla vulnerabilità economica"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Unità di misura">
                      <input
                        className={inputCls}
                        value={pfsEnableForm.newKpiUnit}
                        onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, newKpiUnit: e.target.value })}
                        placeholder="persone / famiglie"
                      />
                    </Field>
                    <Field label="Valore Sociale Stimato (€/un.)">
                      <input
                        type="number"
                        className={inputCls}
                        value={pfsEnableForm.valuePerUnit}
                        onChange={(e) => setPfsEnableForm({ ...pfsEnableForm, valuePerUnit: Number(e.target.value) })}
                        placeholder="3000"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                onClick={() => setPfsModalOpen(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className={cn(btnPrimary, "bg-fuchsia-600 hover:bg-fuchsia-700")}
                disabled={pfsModalBusy || (!pfsEnableForm.kpiId && !pfsEnableForm.newKpiTitle.trim()) || pfsEnableForm.budget <= 0}
                onClick={async () => {
                  setPfsModalBusy(true);
                  await enablePayForSuccess(
                    project.id,
                    {
                      payer: pfsEnableForm.payer,
                      budget: Number(pfsEnableForm.budget),
                      targetUnits: Number(pfsEnableForm.targetUnits),
                      kpiId: pfsEnableForm.kpiId ? Number(pfsEnableForm.kpiId) : undefined,
                      newKpiTitle: pfsEnableForm.newKpiTitle || undefined,
                      newKpiUnit: pfsEnableForm.newKpiUnit || undefined,
                      valuePerUnit: Number(pfsEnableForm.valuePerUnit) || undefined,
                    },
                    user.id
                  );
                  setPfsModalBusy(false);
                  setPfsModalOpen(false);
                }}
              >
                {pfsModalBusy ? "Attivazione…" : "Attiva Pay for Success"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
