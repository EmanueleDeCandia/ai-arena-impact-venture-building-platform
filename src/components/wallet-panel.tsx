"use client";

import { useState } from "react";
import { ArrowDownToLine, Coins, Link2, Lock } from "lucide-react";
import type { ProjectDTO, TxDTO, TrancheDTO } from "@/lib/types";
import { mintToken } from "@/actions";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtEUR, fmtEURCompact, fmtNum, formatDate, shortHash } from "@/lib/format";
import { Badge, btnPrimary, Card, Field, inputCls, SectionTitle } from "@/components/ui";

const TX_META: Record<TxDTO["type"], { label: string; badge: string }> = {
  COMMITMENT: { label: "Commitment", badge: "border-sky-200 bg-sky-50 text-sky-700" },
  DISBURSEMENT: { label: "Erogazione", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  EXPENSE: { label: "Spesa", badge: "border-amber-200 bg-amber-50 text-amber-700" },
  OUTCOME_VERIFICATION: { label: "Outcome verificato", badge: "border-violet-200 bg-violet-50 text-violet-700" },
};

/** RF-06.4: erogazione vincolata a KPI MRV — parsing condizione "kpi:{id} >= {valore}". */
function checkTrancheCondition(t: TrancheDTO, project: ProjectDTO): { ok: boolean; label: string; kpiTitle: string | null } {
  if (!t.conditions) return { ok: true, label: "Nessuna condizione vincolante", kpiTitle: null };
  const m = t.conditions.match(/kpi:(\d+)\s*>=\s*([\d.]+)/);
  if (!m) return { ok: false, label: "Condizione manuale: richiesta verifica auditor", kpiTitle: null };
  const kpiId = Number(m[1]);
  const required = Number(m[2]);
  const kpi = project.kpis.find((k) => k.id === kpiId);
  if (!kpi) return { ok: false, label: `KPI #${kpiId} non trovato`, kpiTitle: null };
  const ok = kpi.current >= required;
  return { ok, label: `${kpi.title}: ${fmtNum(kpi.current)}/${required} ${kpi.unit}`, kpiTitle: kpi.title };
}

export function WalletPanel({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canMint = hasPerm(user.role, "wallet.mint");
  const [mintForm, setMintForm] = useState({ kpiId: "", amount: "", description: "" });

  const conditional = project.tranches.filter((t) => t.conditions && t.status !== "DISBURSED");

  return (
    <div className="space-y-5">
      {/* Conditional disbursement */}
      {conditional.length > 0 && (
        <Card className="p-4">
          <SectionTitle
            title="Erogazione condizionale (RF-06.4)"
            subtitle="Tranche vincolate a KPI verificati dal sistema MRV"
            right={<Lock className="h-4 w-4 text-slate-400" />}
          />
          <div className="space-y-2">
            {conditional.map((t) => {
              const c = checkTrancheCondition(t, project);
              return (
                <div key={t.id} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", c.ok ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50")}>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", c.ok ? "bg-emerald-500 text-white" : "bg-amber-400 text-white")}>
                    {c.ok ? "✓" : "⏳"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                    <div className="text-[11px] text-slate-500">{c.label}</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{fmtEURCompact(t.amount)}</div>
                  <Badge className="border-slate-200 bg-white text-slate-500">{t.status}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Movimenti tracciati</div>
          <div className="mt-1 text-3xl font-black text-slate-900">{project.transactions.length}</div>
          <p className="mt-1 text-[11px] text-slate-400">Transazioni finanziarie e coniazioni con hash immutabile (RF-09.1)</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Token d'impatto coniati</div>
          <div className="mt-1 text-3xl font-black text-violet-600">{fmtNum(project.tokens.reduce((s, t) => s + t.amount, 0), 0)}</div>
          <p className="mt-1 text-[11px] text-slate-400">1 Token = 1 unità di outcome certificata da MRV (RF-09.3)</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valore Sociale Generato</div>
          <div className="mt-1 text-3xl font-black text-emerald-600">
            {fmtEUR(project.kpis.reduce((s, k) => s + k.current * k.valuePerUnit, 0))}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Controvalore economico monetizzato 1y ({fmtEUR(project.kpis.reduce((s, k) => s + k.current * k.valuePerUnit, 0) * 5)} 5y)</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle title="Wallet logico — transazioni" subtitle="Fondo → Banca → ETS → Beneficiario → Evidenza" />
          <div className="space-y-2">
            {project.transactions.map((t) => {
              const isOutcome = t.type === "OUTCOME_VERIFICATION";
              // Calcolo controvalore monetizzato indicativo per l'outcome verificato
              const estimatedUnitVal = project.kpis[0]?.valuePerUnit || 1200;
              const monetizedVal = t.amount * estimatedUnitVal;

              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <Badge className={TX_META[t.type].badge}>{TX_META[t.type].label}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <span className="truncate">{t.fromEntity}</span>
                      <ArrowDownToLine className="h-3 w-3 shrink-0 text-slate-300" />
                      <span className="truncate">{t.toEntity}</span>
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {t.note ?? t.trancheLabel ?? "—"} · <span className="font-mono">{shortHash(t.hash)}</span> · {formatDate(t.date)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {isOutcome ? (
                      <div>
                        <div className="text-sm font-bold text-violet-700">{fmtNum(t.amount, 0)} Token</div>
                        <div className="text-[10px] font-medium text-emerald-600">Valore: {fmtEUR(monetizedVal)}</div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-slate-900">{fmtEURCompact(t.amount)}</div>
                    )}
                  </div>
                </div>
              );
            })}
            {project.transactions.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Nessuna transazione registrata</p>}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <SectionTitle title="Token d'impatto" subtitle="1 unità di outcome verificato" />
            <div className="space-y-2">
              {project.tokens.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
                  <Coins className="h-4 w-4 shrink-0 text-violet-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-violet-800">{fmtNum(t.amount, 0)} token</div>
                    <div className="text-[10px] text-slate-500">{t.description}</div>
                  </div>
                </div>
              ))}
              {project.tokens.length === 0 && <p className="py-2 text-center text-xs text-slate-400">Nessun token coniato</p>}
            </div>
            {canMint && (
              <div className="mt-3 space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Conia token (outcome verificato)</div>
                <Field label="KPI di riferimento">
                  <select className={inputCls} value={mintForm.kpiId} onChange={(e) => setMintForm({ ...mintForm, kpiId: e.target.value })}>
                    <option value="">—</option>
                    {project.kpis.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantità">
                  <input type="number" className={inputCls} value={mintForm.amount} onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })} />
                </Field>
                <Field label="Descrizione">
                  <input className={inputCls} value={mintForm.description} onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })} placeholder="1 token = 1 …" />
                </Field>
                <button
                  className={btnPrimary}
                  onClick={async () => {
                    const amount = Number(mintForm.amount);
                    if (!mintForm.description || !amount || amount <= 0) return;
                    await mintToken(project.id, mintForm.kpiId ? Number(mintForm.kpiId) : null, amount, mintForm.description, user.id);
                    setMintForm({ kpiId: "", amount: "", description: "" });
                  }}
                >
                  <Link2 className="h-4 w-4" /> Conia
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
