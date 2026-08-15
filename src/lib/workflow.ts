import type { ProjectStatus } from "@/db/schema";
import type { ProjectDTO } from "@/lib/types";
import { computeFinance, computeSroi, kpiProgress, underwritingFinalScore } from "@/lib/finance";

/** RF-5: Workflow State Machine — OPPORTUNITY -> … -> EXIT/SCALE. */
export const WORKFLOW: { key: ProjectStatus; label: string; short: string }[] = [
  { key: "OPPORTUNITY", label: "Opportunità", short: "Opp" },
  { key: "FOUNDRY_DRAFT", label: "Foundry Draft", short: "Draft" },
  { key: "CO_DESIGN", label: "Co-Design", short: "Co-Des" },
  { key: "STRUCTURED", label: "Strutturata", short: "Struct" },
  { key: "UNDERWRITING", label: "Underwriting", short: "Underw" },
  { key: "FUNDING_COMMITTED", label: "Funding", short: "Fund" },
  { key: "EXECUTION", label: "Execution", short: "Exec" },
  { key: "MRV_MONITORING", label: "MRV", short: "MRV" },
  { key: "EXIT_SCALE", label: "Exit / Scale", short: "Exit" },
];

export const STATUS_LABEL: Record<ProjectStatus, string> = Object.fromEntries(
  WORKFLOW.map((w) => [w.key, w.label])
) as Record<ProjectStatus, string>;

export const STATUS_BADGE: Record<ProjectStatus, string> = {
  OPPORTUNITY: "bg-slate-100 text-slate-600 border-slate-200",
  FOUNDRY_DRAFT: "bg-slate-200 text-slate-700 border-slate-300",
  CO_DESIGN: "bg-sky-100 text-sky-800 border-sky-200",
  STRUCTURED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  UNDERWRITING: "bg-violet-100 text-violet-800 border-violet-200",
  FUNDING_COMMITTED: "bg-teal-100 text-teal-800 border-teal-200",
  EXECUTION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MRV_MONITORING: "bg-amber-100 text-amber-800 border-amber-200",
  EXIT_SCALE: "bg-green-700 text-white border-green-800",
};

export const NEXT_STATUS: Record<ProjectStatus, ProjectStatus | null> = {
  OPPORTUNITY: "FOUNDRY_DRAFT",
  FOUNDRY_DRAFT: "CO_DESIGN",
  CO_DESIGN: "STRUCTURED",
  STRUCTURED: "UNDERWRITING",
  UNDERWRITING: "FUNDING_COMMITTED",
  FUNDING_COMMITTED: "EXECUTION",
  EXECUTION: "MRV_MONITORING",
  MRV_MONITORING: "EXIT_SCALE",
  EXIT_SCALE: null,
};

export type Check = { label: string; passed: boolean; hint: string };

const hasSignedTermSheet = (p: ProjectDTO) =>
  p.documents.some((d) => d.category === "TERM_SHEET" && d.status === "SIGNED");

const distinctTypes = (p: ProjectDTO) => new Set(p.stakeholders.map((s) => s.type)).size;

/** Checklist vincolante per la transizione dallo stato corrente (RF-5 + criteri accettazione RF-2). */
export function transitionChecks(p: ProjectDTO): Check[] {
  const f = computeFinance(p.tranches, p);
  switch (p.status) {
    case "FOUNDRY_DRAFT":
      return [
        {
          label: "Almeno 1 stakeholder invitato nel Foundry",
          passed: p.stakeholders.length >= 1,
          hint: `${p.stakeholders.length}/1 tipologie coinvolte`,
        },
      ];
    case "CO_DESIGN":
      return [
        {
          label: "Almeno 3 tipologie di stakeholder diverse",
          passed: distinctTypes(p) >= 3,
          hint: `${distinctTypes(p)}/3 tipologie`,
        },
        {
          label: "Teoria del Cambiamento validata",
          passed: p.toc.validated,
          hint: "Valida il canvas ToC nella scheda Panoramica",
        },
        {
          label: "RACI definito (almeno 1 work package)",
          passed: p.raci.length >= 1,
          hint: `${p.raci.length} work package definiti`,
        },
      ];
    case "STRUCTURED":
      return [
        {
          label: "Almeno 2 tranche di finanza blended",
          passed: p.tranches.filter((t) => t.instrument !== "GUARANTEE").length >= 2,
          hint: `${p.tranches.filter((t) => t.instrument !== "GUARANTEE").length}/2 tranche`,
        },
        {
          label: "Leva finanziaria ≥ 2x (ogni € grant genera ≥ 2€)",
          passed: f.leverage >= 2,
          hint: `Leva attuale ${f.leverage.toFixed(1)}x`,
        },
      ];
    case "UNDERWRITING":
      return [
        {
          label: "Score integrato Underwriting ≥ 60",
          passed: underwritingFinalScore(p.creditScore, p.impactScore) >= 60,
          hint: `Score ${underwritingFinalScore(p.creditScore, p.impactScore).toFixed(0)}/100 (soglia 60)`,
        },
        {
          label: "Term Sheet firmato da tutti gli stakeholder",
          passed: hasSignedTermSheet(p),
          hint: "Firma il Term Sheet nella Deal Room",
        },
        {
          label: "Verifica DNSH (Do No Significant Harm) OK",
          passed: p.dnshOk,
          hint: "Attiva la verifica DNSH nella scheda Underwriting",
        },
      ];
    case "FUNDING_COMMITTED":
      return [
        {
          label: "Term Sheet firmato",
          passed: hasSignedTermSheet(p),
          hint: "Deal Room → Term Sheet",
        },
        {
          label: "Copertura garanzia presente se esiste debito senior",
          passed:
            f.debt === 0 || p.tranches.some((t) => t.instrument === "GUARANTEE"),
          hint: f.debt > 0 ? "Aggiungi una tranche GARANZIA (MCC/FEI/SACE)" : "Nessun debito senior",
        },
      ];
    case "EXECUTION":
      return [
        {
          label: "Almeno 3 KPI con metodo di verifica definito",
          passed: p.kpis.filter((k) => k.verificationMethod).length >= 3,
          hint: `${p.kpis.filter((k) => k.verificationMethod).length}/3 KPI verificabili`,
        },
      ];
    case "MRV_MONITORING":
      return [
        {
          label: "SROI dinamico ≥ 1.0",
          passed: computeSroi(p.kpis, computeFinance(p.tranches, p).total) >= 1,
          hint: `SROI ${computeSroi(p.kpis, computeFinance(p.tranches, p).total).toFixed(2)}`,
        },
        {
          label: "≥ 50% dei KPI oltre l'80% del target",
          passed: kpiProgressCheck(p),
          hint: kpiProgressHint(p),
        },
      ];
    default:
      return [];
  }
}

function kpiProgressCheck(p: ProjectDTO): boolean {
  if (p.kpis.length === 0) return false;
  const above = p.kpis.filter((k) => kpiProgress(k) >= 0.8).length;
  return above / p.kpis.length >= 0.5;
}

function kpiProgressHint(p: ProjectDTO): string {
  if (p.kpis.length === 0) return "Nessun KPI definito";
  const above = p.kpis.filter((k) => kpiProgress(k) >= 0.8).length;
  return `${above}/${p.kpis.length} KPI ≥ 80% target`;
}

/** RF-10: criteri di accettazione generali — progetto "bancabile e lanciato". */
export function bancabilityChecks(p: ProjectDTO): Check[] {
  const f = computeFinance(p.tranches, p);
  return [
    {
      label: "Foundry completo: ToC validata + RACI + 3 stakeholder diversi",
      passed: p.toc.validated && p.raci.length >= 1 && distinctTypes(p) >= 3,
      hint: `ToC ${p.toc.validated ? "✓" : "✗"} · RACI ${p.raci.length} · ${distinctTypes(p)} tipologie`,
    },
    {
      label: "Leva finanziaria ≥ 2x",
      passed: f.leverage >= 2,
      hint: `Leva ${f.leverage.toFixed(1)}x`,
    },
    {
      label: "Score Underwriting ≥ soglia tenant (60)",
      passed: underwritingFinalScore(p.creditScore, p.impactScore) >= 60,
      hint: `Score ${underwritingFinalScore(p.creditScore, p.impactScore).toFixed(0)}/100`,
    },
    {
      label: "Term Sheet firmato da tutti",
      passed: hasSignedTermSheet(p),
      hint: hasSignedTermSheet(p) ? "Firmato" : "Da firmare",
    },
    {
      label: "≥ 3 KPI con metodo di verifica definito",
      passed: p.kpis.filter((k) => k.verificationMethod).length >= 3,
      hint: `${p.kpis.filter((k) => k.verificationMethod).length}/3 KPI`,
    },
  ];
}

export function workflowOrder(status: ProjectStatus): number {
  return WORKFLOW.findIndex((w) => w.key === status);
}
