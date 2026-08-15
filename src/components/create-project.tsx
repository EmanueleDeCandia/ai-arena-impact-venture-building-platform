"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Globe2,
  Landmark,
  Layers,
  MapPin,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { createProjectFull } from "@/actions";
import { useRole } from "@/components/role-provider";
import { Badge, btnPrimary, btnSecondary, Field, inputCls, Modal } from "@/components/ui";
import { ITALIAN_REGIONS } from "@/components/opportunity-radar";
import { cn, fmtEUR } from "@/lib/format";

const AVAILABLE_SDGS = [
  "SDG 1: No Poverty",
  "SDG 3: Good Health",
  "SDG 4: Quality Education",
  "SDG 7: Clean Energy",
  "SDG 8: Decent Work",
  "SDG 9: Industry & Innovation",
  "SDG 10: Reduced Inequalities",
  "SDG 11: Sustainable Cities",
  "SDG 12: Responsible Consumption",
  "SDG 13: Climate Action",
];

export function CreateProjectButton() {
  const { user } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    // Step 1: Anagrafica & Territorio
    name: "",
    tagline: "",
    territory: ITALIAN_REGIONS[0],
    commune: "",
    // Step 2: Bisogno & SDGs
    description: "",
    sdgTags: [] as string[],
    // Step 3: Fabbisogno & PFS
    fundingNeed: 500000,
    annualRevenue: 250000,
    annualOpex: 180000,
    enablePfs: false,
    pfsPayer: "Comune / Fondazione Territoriale",
    pfsBudget: 150000,
    // Step 4: Outcome Target
    kpiTitle: "Persone / Beneficiari coinvolti con successo",
    kpiUnit: "persone",
    kpiTarget: 50,
    kpiValuePerUnit: 3000,
  });

  const toggleSdg = (sdg: string) => {
    if (form.sdgTags.includes(sdg)) {
      setForm({ ...form, sdgTags: form.sdgTags.filter((s) => s !== sdg) });
    } else {
      setForm({ ...form, sdgTags: [...form.sdgTags, sdg] });
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    const res = await createProjectFull({
      name: form.name,
      tagline: form.tagline || undefined,
      description: form.description || "Progetto creato da Wizard Venture Builder",
      territory: form.territory,
      commune: form.commune || undefined,
      sdgTags: form.sdgTags,
      fundingNeed: Number(form.fundingNeed) || 0,
      annualRevenue: Number(form.annualRevenue) || 0,
      annualOpex: Number(form.annualOpex) || 0,
      enablePfs: form.enablePfs,
      pfsPayer: form.enablePfs ? form.pfsPayer : undefined,
      pfsBudget: form.enablePfs ? Number(form.pfsBudget) : undefined,
      kpiTitle: form.kpiTitle || undefined,
      kpiUnit: form.kpiUnit || undefined,
      kpiTarget: Number(form.kpiTarget) || undefined,
      kpiValuePerUnit: Number(form.kpiValuePerUnit) || undefined,
      actorId: user.id,
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setStep(1);
      router.push(`/dashboard/projects/${res.projectId}`);
    }
  };

  return (
    <>
      <button className={btnPrimary} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuovo Progetto (Wizard)
      </button>

      {open && (
        <Modal
          title="Creazione Guidata Nuova Venture (Wizard)"
          onClose={() => {
            setOpen(false);
            setStep(1);
          }}
        >
          <div className="space-y-4">
            {/* Stepper indicator */}
            <div className="grid grid-cols-4 gap-1.5 border-b border-slate-100 pb-3 text-center">
              {[
                { n: 1, label: "Territorio", icon: <MapPin className="h-3 w-3 inline" /> },
                { n: 2, label: "Bisogno & SDGs", icon: <Globe2 className="h-3 w-3 inline" /> },
                { n: 3, label: "Finanza & PFS", icon: <Landmark className="h-3 w-3 inline" /> },
                { n: 4, label: "Outcome KPI", icon: <Target className="h-3 w-3 inline" /> },
              ].map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "rounded-lg p-1.5 text-xs transition-colors",
                    step === s.n
                      ? "bg-emerald-600 font-bold text-white shadow-sm"
                      : step > s.n
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : "bg-slate-50 text-slate-400"
                  )}
                >
                  <div>Step {s.n}</div>
                  <div className="truncate text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* STEP 1: Anagrafica & Territorio */}
            {step === 1 && (
              <div className="space-y-3">
                <Field label="Nome della Venture / Progetto *">
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="es. Cooperativa di Comunità Appennino"
                    autoFocus
                  />
                </Field>
                <Field label="Tagline sintetica">
                  <input
                    className={inputCls}
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    placeholder="es. Transizione energetica e inclusione occupazionale per le aree interne"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Territorio (Regione)">
                    <select
                      className={inputCls}
                      value={form.territory}
                      onChange={(e) => setForm({ ...form, territory: e.target.value })}
                    >
                      {ITALIAN_REGIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Comune / Ambito locale">
                    <input
                      className={inputCls}
                      value={form.commune}
                      onChange={(e) => setForm({ ...form, commune: e.target.value })}
                      placeholder="es. Rieti / Basso Sangro"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2: Bisogno & SDGs */}
            {step === 2 && (
              <div className="space-y-3">
                <Field label="Descrizione del bisogno e sfida territoriale">
                  <textarea
                    rows={3}
                    className={cn(inputCls, "h-auto py-2")}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrivere il fabbisogno sociale o ambientale non soddisfatto, la popolazione target e gli asset disponibili…"
                  />
                </Field>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Obiettivi di Sviluppo Sostenibile (SDGs)</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {AVAILABLE_SDGS.map((sdg) => {
                      const active = form.sdgTags.includes(sdg);
                      return (
                        <button
                          key={sdg}
                          type="button"
                          onClick={() => toggleSdg(sdg)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                            active
                              ? "border-emerald-600 bg-emerald-600 font-bold text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {sdg}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Finanza & Pay for Success */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Fabbisogno (€)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.fundingNeed}
                      onChange={(e) => setForm({ ...form, fundingNeed: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Ricavi annui (€)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.annualRevenue}
                      onChange={(e) => setForm({ ...form, annualRevenue: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Opex annuo (€)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.annualOpex}
                      onChange={(e) => setForm({ ...form, annualOpex: Number(e.target.value) })}
                    />
                  </Field>
                </div>

                {/* Switch Pay for Success */}
                <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50/40 p-3">
                  <label className="flex items-center gap-2 font-bold text-fuchsia-950 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enablePfs}
                      onChange={(e) => setForm({ ...form, enablePfs: e.target.checked })}
                      className="h-4 w-4 rounded border-fuchsia-300 text-fuchsia-600 focus:ring-fuchsia-500"
                    />
                    <span>Abilita Finanziamento a Risultato (Pay for Success / SIB)</span>
                    <Badge className="border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 text-[10px]">Consigliato</Badge>
                  </label>

                  {form.enablePfs && (
                    <div className="mt-2.5 space-y-2 border-t border-fuchsia-200/60 pt-2 text-xs">
                      <Field label="Outcome Payer (PA / Fondazione / Impresa Anchor)">
                        <input
                          className={inputCls}
                          value={form.pfsPayer}
                          onChange={(e) => setForm({ ...form, pfsPayer: e.target.value })}
                          placeholder="es. Comune di Milano / Fondazione Cariplo"
                        />
                      </Field>
                      <Field label="Plafond Outcome Payment impegnato (€)">
                        <input
                          type="number"
                          className={inputCls}
                          value={form.pfsBudget}
                          onChange={(e) => setForm({ ...form, pfsBudget: Number(e.target.value) })}
                          placeholder="es. 150000"
                        />
                      </Field>
                      <p className="text-[10px] text-fuchsia-700">
                        💡 L'Outcome Payer liquiderà le somme a SAL in funzione degli outcome verificati dall'auditor MRV.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Outcome & KPI Iniziale */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Definizione dell'Outcome Primario di Progetto
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Definisci la metrica target che verrà monitorata dal sistema MRV e valorizzata per il calcolo dello SROI e del Pay for Success.
                  </p>
                </div>

                <Field label="Titolo dell'Outcome / KPI Primario *">
                  <input
                    className={inputCls}
                    value={form.kpiTitle}
                    onChange={(e) => setForm({ ...form, kpiTitle: e.target.value })}
                    placeholder="es. Giovani NEET inseriti stabilmente nel mercato del lavoro"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-2">
                  <Field label="Unità">
                    <input
                      className={inputCls}
                      value={form.kpiUnit}
                      onChange={(e) => setForm({ ...form, kpiUnit: e.target.value })}
                      placeholder="persone / famiglie"
                    />
                  </Field>
                  <Field label="Target (Qtà)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.kpiTarget}
                      onChange={(e) => setForm({ ...form, kpiTarget: Number(e.target.value) })}
                      placeholder="50"
                    />
                  </Field>
                  <Field label="Valore Unitario (€)">
                    <input
                      type="number"
                      className={inputCls}
                      value={form.kpiValuePerUnit}
                      onChange={(e) => setForm({ ...form, kpiValuePerUnit: Number(e.target.value) })}
                      placeholder="3000"
                    />
                  </Field>
                </div>

                {form.enablePfs && form.kpiTarget > 0 && form.pfsBudget > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Costo Unitario Stimato:</span>
                      <span>{fmtEUR(Math.round(form.pfsBudget / form.kpiTarget))}/{form.kpiUnit}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Valore Sociale Stimato:</span>
                      <span>{fmtEUR(form.kpiValuePerUnit)}/{form.kpiUnit}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              {step > 1 ? (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setStep(step - 1)}
                  disabled={busy}
                >
                  <ArrowLeft className="h-4 w-4" /> Indietro
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Annulla
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={step === 1 && !form.name.trim()}
                  onClick={() => setStep(step + 1)}
                >
                  Avanti <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className={cn(btnPrimary, "bg-emerald-600 hover:bg-emerald-700")}
                  disabled={busy || !form.name.trim()}
                  onClick={handleCreate}
                >
                  {busy ? "Creazione in corso…" : "Crea Venture & Avvia Foundry"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
