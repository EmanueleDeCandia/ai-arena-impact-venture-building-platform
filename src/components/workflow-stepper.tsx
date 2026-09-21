"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Unlock,
  UserCheck,
  Zap,
} from "lucide-react";
import type { ProjectDTO } from "@/lib/types";
import { NEXT_STATUS, STATUS_LABEL, WORKFLOW, transitionChecks, workflowOrder } from "@/lib/workflow";
import { cn } from "@/lib/format";
import { Badge, btnPrimary, btnSecondary, CheckItem, Modal } from "@/components/ui";
import {
  advanceProject,
  generateAndSignTermSheet,
  setDnsh,
  updateUnderwriting,
  validateToc,
} from "@/actions";
import { useRole } from "@/components/role-provider";
import { hasPerm } from "@/lib/permissions";

export function WorkflowStepper({ project }: { project: ProjectDTO }) {
  const { user, users, setUserId } = useRole();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string[] | null>(null);
  const [done, setDone] = useState(false);

  const current = workflowOrder(project.status);
  const next = NEXT_STATUS[project.status];
  const checks = transitionChecks(project);
  const allPassed = checks.every((c) => c.passed);
  const isAdminOrOriginator = user.role === "SUPER_ADMIN" || user.role === "ORIGINATOR";
  const canAdvance = hasPerm(user.role, "project.advance") && !!next;

  const originatorUser = users.find((u) => u.role === "ORIGINATOR");
  const adminUser = users.find((u) => u.role === "SUPER_ADMIN");

  const handleAdvance = async (force: boolean = false) => {
    setBusy(true);
    setError(null);
    const res = await advanceProject(project.id, user.id, force);
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setOpen(false);
    } else {
      setError(res.failedChecks ?? [res.error ?? "Errore durante la transizione"]);
    }
  };

  return (
    <div className="tactile-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-engraved text-sm font-black uppercase tracking-wider text-slate-700">
              Workflow — State Machine
            </h3>
            <Badge className="border-slate-300 bg-white font-black text-slate-700">
              Fase {current + 1} di {WORKFLOW.length}
            </Badge>
          </div>
          <p className="text-engraved-subtle mt-0.5 text-xs font-medium text-slate-500">
            Opportunity → Foundry → Co-Design → Struttura → Underwriting → Funding → Execution → MRV → Exit
          </p>
        </div>

        {next && (
          <div className="flex items-center gap-2">
            {!canAdvance && (
              <span className="text-engraved-subtle text-[11px] font-bold text-amber-700">
                🔒 Accesso sola lettura ({user.role})
              </span>
            )}
            <button
              className={cn(
                btnPrimary,
                !allPassed && !canAdvance && "bg-slate-400 hover:bg-slate-400 cursor-not-allowed",
                !allPassed && canAdvance && "bg-gradient-to-b from-amber-500 to-amber-600 border-amber-700 hover:from-amber-400 hover:to-amber-500"
              )}
              onClick={() => setOpen(true)}
              title={
                !canAdvance
                  ? "Permesso richiesto: Super Admin o Originator"
                  : allPassed
                  ? "Tutti i criteri soddisfatti: pronto per l'avanzamento"
                  : "Criteri parziali: apri per verificare o forzare l'avanzamento"
              }
            >
              {allPassed ? (
                <Unlock className="h-4 w-4 text-emerald-200 filter drop-shadow-sm" />
              ) : (
                <Lock className="h-4 w-4 text-amber-200 filter drop-shadow-sm" />
              )}
              <span>Avanza a {STATUS_LABEL[next]}</span>
            </button>
          </div>
        )}
      </div>

      {/* Workflow steps visual bar */}
      <div className="tactile-sunken flex items-center gap-1.5 overflow-x-auto rounded-2xl p-2 pb-2">
        {WORKFLOW.map((w, i) => {
          const doneStep = i < current;
          const active = i === current;
          return (
            <div key={w.key} className="flex shrink-0 items-center">
              <div
                className={cn(
                  "flex flex-col items-center rounded-xl px-3 py-2 transition-all",
                  active
                    ? "tactile-card border-emerald-500/40 bg-gradient-to-b from-emerald-50 to-teal-100/90 shadow-md ring-2 ring-emerald-400/40"
                    : doneStep
                    ? "tactile-card border-white/90 bg-white"
                    : "border border-slate-200/40 bg-slate-100/60 opacity-60"
                )}
                title={w.label}
              >
                <span
                  className={cn(
                    "tactile-icon-well flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black",
                    doneStep
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm ring-2 ring-emerald-300"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {doneStep ? "✓" : i + 1}
                </span>
                <span className="text-engraved mt-1 text-[10px] font-black text-slate-800">{w.short}</span>
              </div>
              {i < WORKFLOW.length - 1 && <ArrowRight className="mx-1 h-3 w-3 shrink-0 text-slate-400" />}
            </div>
          );
        })}
      </div>

      {/* Real-time Checklist Chips with quick guidance */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-engraved-subtle text-[11px] font-black uppercase tracking-wider text-slate-500">
          Criteri Transizione:
        </span>
        {checks.map((c) => (
          <span
            key={c.label}
            className={cn(
              "tactile-pill flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold transition-all",
              c.passed
                ? "border-emerald-400/30 bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-800"
                : "border-amber-400/30 bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900"
            )}
            title={c.hint}
          >
            {c.passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <span className="text-amber-700 font-bold">⏳</span>
            )}
            {c.label}
          </span>
        ))}
      </div>

      {done && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          ✓ Transizione di stato completata con successo
        </p>
      )}

      {/* Modal di Transizione & Sblocco */}
      {open && (
        <Modal
          title={`Transizione Workflow: ${STATUS_LABEL[project.status]} → ${STATUS_LABEL[next!]}`}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              La state machine verifica i criteri di conformità (RF-05) per garantire che ogni fase del venture building sia documentata.
            </p>

            {/* Checklist items with interactive quick-fixes */}
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-700">Checklist di Avanzamento:</div>
              {checks.map((c) => (
                <div
                  key={c.label}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-2.5 text-xs",
                    c.passed ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={c.passed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {c.passed ? "✓" : "⏳"}
                    </span>
                    <div>
                      <div className={cn("font-semibold", c.passed ? "text-emerald-900" : "text-amber-900")}>
                        {c.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.hint}</div>
                    </div>
                  </div>

                  {/* 1-Click Action Shortcuts if not passed */}
                  {!c.passed && c.label.includes("Teoria del Cambiamento") && (
                    <button
                      type="button"
                      onClick={async () => {
                        await validateToc(project.id, true, user.id);
                      }}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shrink-0"
                    >
                      ⚡ Valida ToC Ora
                    </button>
                  )}
                  {!c.passed && c.label.includes("DNSH") && (
                    <button
                      type="button"
                      onClick={async () => {
                        await setDnsh(project.id, true, user.id);
                      }}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shrink-0"
                    >
                      ⚡ Valida DNSH Ora
                    </button>
                  )}
                  {!c.passed && c.label.includes("Term Sheet") && (
                    <button
                      type="button"
                      onClick={async () => {
                        await generateAndSignTermSheet(project.id, user.id);
                      }}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shrink-0"
                    >
                      ⚡ Firma Term Sheet Ora
                    </button>
                  )}
                  {!c.passed && c.label.includes("Score integrato Underwriting") && (
                    <button
                      type="button"
                      onClick={async () => {
                        await updateUnderwriting(
                          project.id,
                          {
                            creditScore: 82,
                            impactScore: 85,
                            taxonomyAlignmentPct: 80,
                            sfdrCategory: "ARTICLE_9",
                            expectedLossPct: 1.2,
                          },
                          user.id
                        );
                      }}
                      className="rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 shrink-0"
                    >
                      ⚡ Auto-Score (84/100)
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Role Helper if current user is not Admin/Originator */}
            {!canAdvance && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Ruolo attuale: {user.name} ({user.role})
                </div>
                <p className="mt-1 text-[11px] text-amber-700">
                  Per procedere con l'avanzamento del workflow è necessario un ruolo con permessi di Originator o Super Admin.
                </p>
                <div className="mt-2 flex gap-2">
                  {originatorUser && (
                    <button
                      type="button"
                      onClick={() => setUserId(originatorUser.id)}
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                    >
                      Passa a Giulia Moretti (Originator)
                    </button>
                  )}
                  {adminUser && (
                    <button
                      type="button"
                      onClick={() => setUserId(adminUser.id)}
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                    >
                      Passa a Marta Rinaldi (Super Admin)
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <div className="font-bold">Attenzione:</div>
                {error.map((e) => (
                  <div key={e}>• {e}</div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                Chiudi
              </button>

              <div className="flex items-center gap-2">
                {/* Admin Override button if not all checks passed */}
                {!allPassed && isAdminOrOriginator && (
                  <button
                    type="button"
                    className={cn(btnSecondary, "border-amber-300 text-amber-800 hover:bg-amber-50 text-xs")}
                    disabled={busy}
                    onClick={() => handleAdvance(true)}
                    title="Avanza comunque registrando l'override nell'Audit Log"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    Forzatura Admin (Override)
                  </button>
                )}

                <button
                  type="button"
                  className={cn(btnPrimary, !allPassed && "bg-slate-400 hover:bg-slate-400")}
                  disabled={busy || !allPassed || !canAdvance}
                  onClick={() => handleAdvance(false)}
                >
                  {busy ? "Verifica in corso…" : "Conferma Transizione"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
