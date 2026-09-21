"use client";

import { useState } from "react";
import { Bot, MapPin, Plus, Rocket } from "lucide-react";
import type { OpportunityDTO } from "@/lib/types";
import { convertOpportunity, addOpportunity, runAgent } from "@/actions";
import type { AgentResult } from "@/lib/agents";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtEURCompact, fmtNum } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, Field, inputCls, Modal, ScoreRing, SectionTitle } from "@/components/ui";

export const ITALIAN_REGIONS = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia",
  "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna",
  "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto",
];

function gravityColor(g: number): string {
  if (g >= 9) return "tactile-pill border-rose-400/50 bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-sm";
  if (g >= 7) return "tactile-pill border-orange-400/50 bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-sm";
  if (g >= 5) return "tactile-pill border-amber-400/50 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-sm";
  if (g >= 3) return "tactile-pill border-yellow-300/50 bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-900 shadow-sm";
  return "tactile-pill border-slate-200 bg-gradient-to-b from-white to-slate-100 text-slate-400";
}

export function OpportunityRadar({ opportunities }: { opportunities: OpportunityDTO[] }) {
  const { user } = useRole();
  const canManage = hasPerm(user.role, "opportunity.manage");
  const canConvert = hasPerm(user.role, "opportunity.convert");
  const [showForm, setShowForm] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [converted, setConverted] = useState<Record<number, number>>({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    territory: ITALIAN_REGIONS[0],
    commune: "",
    gravity: "6",
    populationTarget: "",
    assets: "",
    source: "ISTAT BES",
    economicPotential: "",
  });

  const gravityByRegion = new Map<string, number>();
  for (const o of opportunities) {
    const cur = gravityByRegion.get(o.territory) ?? 0;
    gravityByRegion.set(o.territory, Math.max(cur, o.gravity));
  }

  return (
    <div className="space-y-6">
      {/* Heatmap territoriale */}
      <Card className="p-6">
        <SectionTitle
          title="Heatmap dei bisogni — griglia comunale normalizzata"
          subtitle="RF-01.1 · connector open data ISTAT, BES, OpenCoesione, Registro Imprese"
          right={
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              {[0, 3, 5, 7, 9].map((g) => (
                <span key={g} className={cn("px-2 py-0.5 font-bold", gravityColor(g))}>
                  {g === 0 ? "—" : g}
                </span>
              ))}
            </div>
          }
        />
        <div className="tactile-sunken grid grid-cols-4 gap-2 rounded-2xl p-2.5 md:grid-cols-10">
          {ITALIAN_REGIONS.map((region) => {
            const g = gravityByRegion.get(region) ?? 0;
            return (
              <div
                key={region}
                className={cn("px-2 py-2 text-center text-[10px] font-black leading-tight cursor-default transition hover:scale-105", gravityColor(g))}
                title={`${region} — gravità ${g}/10`}
              >
                {region}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Elenco opportunità */}
      <div className="grid gap-6 lg:grid-cols-2">
        {opportunities.map((o) => (
          <Card key={o.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-engraved text-base font-black text-slate-900">{o.title}</h3>
                  {o.status === "CONVERTED" && (
                    <Badge className="border-emerald-300/40 bg-gradient-to-b from-emerald-50 to-emerald-100 font-bold text-emerald-800">
                      → Foundry
                    </Badge>
                  )}
                </div>
                <div className="text-engraved-subtle mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {o.territory}{o.commune ? ` · ${o.commune}` : ""} · fonte: {o.source}
                </div>
              </div>
              <ScoreRing value={o.opportunityScore} size={76} label="score" />
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{o.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              <div className="tactile-sunken rounded-xl px-3 py-2">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">Gravità bisogno</div>
                <div className="text-engraved-strong font-black text-slate-800">{o.gravity}/10</div>
              </div>
              <div className="tactile-sunken rounded-xl px-3 py-2">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">Potenziale economico</div>
                <div className="text-engraved-strong font-black text-slate-800">{fmtEURCompact(o.economicPotential)}</div>
              </div>
              <div className="tactile-sunken rounded-xl px-3 py-2">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">Popolazione target</div>
                <div className="text-engraved truncate font-bold text-slate-700">{o.populationTarget ?? "—"}</div>
              </div>
              <div className="tactile-sunken rounded-xl px-3 py-2">
                <div className="text-engraved-subtle text-[10px] font-bold uppercase tracking-wider text-slate-500">Asset disponibili</div>
                <div className="text-engraved truncate font-bold text-slate-700">{o.assets ?? "—"}</div>
              </div>
            </div>

            {o.suggestedStakeholders && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {o.suggestedStakeholders.map((s) => (
                  <Badge key={s} className="border-slate-200 bg-white font-bold text-slate-600">{s}</Badge>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2.5 border-t border-slate-200/70 pt-3.5">
              <button
                className={btnSecondary}
                onClick={async () => {
                  setAgentBusy(true);
                  setAgentResult(await runAgent("scout", { opportunityId: o.id }, user.id));
                  setAgentBusy(false);
                }}
                disabled={agentBusy}
              >
                <Bot className="h-4 w-4 text-cyan-600" />
                <span>Scout Agent</span>
              </button>
              {canConvert && o.status !== "CONVERTED" && (
                <button
                  className={btnPrimary}
                  onClick={async () => {
                    const res = await convertOpportunity(o.id, user.id);
                    if (res.ok) setConverted((c) => ({ ...c, [o.id]: res.projectId }));
                  }}
                >
                  <Rocket className="h-4 w-4" />
                  <span>Crea Foundry</span>
                </button>
              )}
              {converted[o.id] && (
                <span className="tactile-pill border-emerald-400/40 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  ✓ Foundry #{converted[o.id]} creato
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {agentResult && (
        <Card className="border-cyan-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-700">
              <Bot className="h-4 w-4" /> {agentResult.title}
            </div>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setAgentResult(null)}>✕</button>
          </div>
          <p className="mb-3 text-sm text-slate-600">{agentResult.summary}</p>
          <div className="space-y-2">
            {agentResult.steps.map((st, i) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-700">{st.text}</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-600">📚 {st.source}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {canManage && (
        <div className="flex justify-center">
          <button className={btnSecondary} onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Registra nuovo bisogno territoriale
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Nuova Opportunità (Need Sensing)" onClose={() => setShowForm(false)} wide>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Titolo">
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Rigenerazione borgo — Irpinia" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descrizione">
                <textarea className={cn(inputCls, "h-20")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <Field label="Regione">
              <select className={inputCls} value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })}>
                {ITALIAN_REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Comune">
              <input className={inputCls} value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} />
            </Field>
            <Field label="Gravità (1-10)">
              <input type="number" min={1} max={10} className={inputCls} value={form.gravity} onChange={(e) => setForm({ ...form, gravity: e.target.value })} />
            </Field>
            <Field label="Potenziale economico (€)">
              <input type="number" className={inputCls} value={form.economicPotential} onChange={(e) => setForm({ ...form, economicPotential: e.target.value })} />
            </Field>
            <Field label="Popolazione target">
              <input className={inputCls} value={form.populationTarget} onChange={(e) => setForm({ ...form, populationTarget: e.target.value })} />
            </Field>
            <Field label="Asset disponibili">
              <input className={inputCls} value={form.assets} onChange={(e) => setForm({ ...form, assets: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Fonte open data">
                <select className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {["ISTAT BES", "OpenCoesione", "Registro Imprese", "Bandi regionali", "Delibere comunali"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setShowForm(false)}>
              Annulla
            </button>
            <button
              className={btnPrimary}
              onClick={async () => {
                if (!form.title || !form.description) return;
                const res = await addOpportunity(
                  {
                    title: form.title,
                    description: form.description,
                    territory: form.territory,
                    commune: form.commune || undefined,
                    gravity: Math.min(10, Math.max(1, Number(form.gravity) || 5)),
                    populationTarget: form.populationTarget || undefined,
                    assets: form.assets || undefined,
                    source: form.source,
                    economicPotential: Number(form.economicPotential) || 0,
                  },
                  user.id
                );
                if (res.ok) {
                  setShowForm(false);
                  setForm({ ...form, title: "", description: "", economicPotential: "", commune: "", assets: "", populationTarget: "" });
                }
              }}
            >
              Registra opportunità (score {Math.min(100, Math.round((Number(form.gravity) || 5) * 7 + Math.min(25, ((Number(form.economicPotential) || 0) / 1_000_000) * 8) + (form.assets ? 10 : 0)))})
            </button>
          </div>
        </Modal>
      )}

      <p className="text-center text-[11px] text-slate-400">
        KPI RF-01: {opportunities.length} opportunità originate · {fmtNum(opportunities.filter((o) => o.status === "CONVERTED").length)} convertite in Foundry
      </p>
    </div>
  );
}
