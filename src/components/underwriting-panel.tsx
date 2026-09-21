"use client";

import { useState } from "react";
import { Bot, Pencil, Save, ShieldCheck, ShieldX } from "lucide-react";
import type { ProjectDTO } from "@/lib/types";
import { computeFinance, underwritingFinalScore } from "@/lib/finance";
import { underwriterAgent } from "@/lib/agents";
import { applyAgentProposal, runAgent, setDnsh, updateUnderwriting } from "@/actions";
import type { AgentResult } from "@/lib/agents";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";
import { cn, fmtPct } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, Card, Field, inputCls, Modal, ProgressBar, ScoreRing, SectionTitle } from "@/components/ui";

export function UnderwritingPanel({ project }: { project: ProjectDTO }) {
  const { user } = useRole();
  const canEdit = hasPerm(user.role, "underwriting.edit");
  const canView = hasPerm(user.role, "underwriting.view") || hasPerm(user.role, "underwriting.edit");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    creditScore: project.creditScore,
    impactScore: project.impactScore,
    taxonomyAlignmentPct: project.taxonomyAlignmentPct,
    sfdrCategory: project.sfdrCategory,
    expectedLossPct: project.expectedLossPct,
  });

  const final = underwritingFinalScore(project.creditScore, project.impactScore);
  const f = computeFinance(project.tranches, project);
  const liveFlags = underwriterAgent(project).payload.flags as string[];

  const run = async () => {
    setBusy(true);
    const res = await runAgent("underwriter", { projectId: project.id }, user.id);
    setResult(res);
    setBusy(false);
  };

  if (!canView) {
    return (
      <Card className="p-8 text-center text-sm text-slate-400">
        Accesso riservato a Banca Promotrice, Fund Manager e Super Admin (RF-02 RBAC esteso).
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Istruttoria Creditizia &amp; d'Impatto (RF-05)</h2>
          <p className="text-xs text-slate-500">
            Valutazione del merito creditizio, tassonomia europea, sfdr e presidi di mitigazione rischio
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setEditForm({
                creditScore: project.creditScore,
                impactScore: project.impactScore,
                taxonomyAlignmentPct: project.taxonomyAlignmentPct,
                sfdrCategory: project.sfdrCategory,
                expectedLossPct: project.expectedLossPct,
              });
              setShowEditModal(true);
            }}
            className={cn(btnSecondary, "text-xs")}
          >
            <Pencil className="h-3.5 w-3.5" /> Modifica Parametri Istruttori
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-center p-5">
          <ScoreRing value={project.creditScore} label="Score creditizio" sub="bilanci ETS / impresa" />
          <p className="mt-2 text-center text-[11px] text-slate-400">Da dati di bilancio degli implementer e dell'anchor</p>
        </Card>
        <Card className="flex flex-col items-center p-5">
          <ScoreRing value={project.impactScore} label="Score impatto" sub="EU Taxonomy + KPI + DNSH" />
          <p className="mt-2 text-center text-[11px] text-slate-400">Allineamento taxonomy, avanzamento KPI, DNSH</p>
        </Card>
        <Card className={cn("flex flex-col items-center p-5", final >= 60 ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40")}>
          <ScoreRing value={final} label="Score integrato" sub="55% credito · 45% impatto" />
          <Badge className={final >= 60 ? "mt-2 border-emerald-200 bg-emerald-50 text-emerald-700" : "mt-2 border-rose-200 bg-rose-50 text-rose-600"}>
            {final >= 60 ? "✓ Sopra soglia tenant (60)" : "✕ Sotto soglia tenant (60)"}
          </Badge>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Allineamento EU Taxonomy</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{Math.round(project.taxonomyAlignmentPct)}%</div>
          <ProgressBar value={project.taxonomyAlignmentPct} className="mt-2" />
          <p className="mt-2 text-[11px] text-slate-400">% attività eleggibili su attività totali (RF-05.3)</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Classificazione SFDR</div>
          <div className="mt-2">
            <Badge className={project.sfdrCategory === "Article 9" ? "border-teal-200 bg-teal-50 text-teal-700" : project.sfdrCategory === "Article 8" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
              {project.sfdrCategory}
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Art 8 = promuove caratteristiche ambientali · Art 9 = obiettivo d'impatto</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verifica DNSH</div>
            {project.dnshOk ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldX className="h-4 w-4 text-rose-400" />}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-800">{project.dnshOk ? "Do No Significant Harm verificato" : "Non verificato"}</div>
          <p className="mt-1 text-[11px] text-slate-400">Requisito per funding EU e transizione Underwriting → Funding</p>
          {canEdit && (
            <button className={cn(btnPrimary, "mt-2 w-full")} onClick={() => setDnsh(project.id, !project.dnshOk, user.id)}>
              {project.dnshOk ? "Ritira verifica" : "Attiva verifica DNSH"}
            </button>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <SectionTitle
          title="Expected Loss & mitigazione (RF-05.2)"
          right={
            <div className="flex items-center gap-2">
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                Garanzia {f.maxGuaranteePct}% → riduzione LGD
              </Badge>
            </div>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Expected Loss attuale</div>
            <div className={cn("text-2xl font-black", project.expectedLossPct > 2.5 ? "text-rose-600" : "text-slate-900")}>
              {fmtPct(project.expectedLossPct, 1)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">DSCR previsto</div>
            <div className="text-2xl font-black text-slate-900">{f.dscr.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Leva</div>
            <div className="text-2xl font-black text-slate-900">{f.leverage.toFixed(1)}x</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle
          title="Risk flags — Underwriter Agent"
          subtitle="Check automatico EU Taxonomy, SFDR, esclusioni e struttura"
          right={
            canEdit && (
              <button className={btnPrimary} onClick={run} disabled={busy}>
                <Bot className="h-4 w-4" />
                {busy ? "Analisi…" : "Pre-compila dossier"}
              </button>
            )
          }
        />
        {liveFlags.length === 0 ? (
          <p className="text-sm text-emerald-600">✓ Nessun rischio bloccante rilevato</p>
        ) : (
          <ul className="space-y-1.5">
            {liveFlags.map((fl) => (
              <li key={fl} className="flex items-start gap-2 text-sm text-rose-600">
                <span className="mt-0.5">⚠</span> {fl}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {result && (
        <Card className="border-violet-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
              <Bot className="h-4 w-4" /> {result.title}
            </div>
            {canEdit && (
              <button className={btnPrimary} onClick={() => applyAgentProposal(project.id, "underwriter", user.id)}>
                Applica score al progetto
              </button>
            )}
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

      {/* Modal di Modifica Parametri Istruttori Underwriting */}
      {showEditModal && (
        <Modal title="Modifica Parametri Underwriting & ESG" onClose={() => setShowEditModal(false)}>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Score Creditizio (0-100)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.creditScore}
                  onChange={(e) => setEditForm({ ...editForm, creditScore: Number(e.target.value) })}
                  className={inputCls}
                />
              </Field>
              <Field label="Score Impatto (0-100)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.impactScore}
                  onChange={(e) => setEditForm({ ...editForm, impactScore: Number(e.target.value) })}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Allineamento EU Taxonomy (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.taxonomyAlignmentPct}
                  onChange={(e) => setEditForm({ ...editForm, taxonomyAlignmentPct: Number(e.target.value) })}
                  className={inputCls}
                />
              </Field>
              <Field label="Classificazione SFDR">
                <select
                  value={editForm.sfdrCategory}
                  onChange={(e) => setEditForm({ ...editForm, sfdrCategory: e.target.value })}
                  className={inputCls}
                >
                  <option value="Article 6">Article 6 (Standard ESG)</option>
                  <option value="Article 8">Article 8 (Promozione ESG)</option>
                  <option value="Article 9">Article 9 (Obiettivo d'Impatto Sostenibile)</option>
                </select>
              </Field>
            </div>

            <Field label="Expected Loss stimata (%)">
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={editForm.expectedLossPct}
                onChange={(e) => setEditForm({ ...editForm, expectedLossPct: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>

            <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-200">
              <span className="font-bold">Score Integrato Risultante: </span>
              <b>{underwritingFinalScore(editForm.creditScore, editForm.impactScore).toFixed(0)} / 100</b>{" "}
              {underwritingFinalScore(editForm.creditScore, editForm.impactScore) >= 60 ? (
                <span className="text-emerald-600 font-bold">(✓ Sopra soglia bancabilità 60)</span>
              ) : (
                <span className="text-rose-600 font-bold">(✕ Sotto soglia bancabilità 60)</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setShowEditModal(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={saving}
                className={btnPrimary}
                onClick={async () => {
                  setSaving(true);
                  await updateUnderwriting(project.id, editForm, user.id);
                  setSaving(false);
                  setShowEditModal(false);
                }}
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Salvataggio…" : "Salva Parametri"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
