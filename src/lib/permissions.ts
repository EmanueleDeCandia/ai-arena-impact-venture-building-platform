import type { StakeholderType, UserRole } from "@/db/schema";

export const STAKEHOLDER_LABELS: Record<StakeholderType, string> = {
  ANCHOR_COMPANY: "Anchor Company",
  BANK_PROMOTER: "Banca Promotrice",
  FUND_MANAGER: "Fund Manager",
  ETS_IMPLEMENTER: "ETS Attuatore",
  PA_VALIDATOR: "PA Validatore",
  COMMUNITY_VALIDATOR: "Community Validator",
  TECH_PARTNER: "Partner Tecnologico",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  TERRITORIAL_ANALYST: "Analista Territoriale",
  ORIGINATOR: "Originator",
  ANCHOR_COMPANY: "Anchor Company",
  BANK_PROMOTER: "Banca Promotrice",
  FUND_MANAGER: "Fund Manager",
  ETS_IMPLEMENTER: "ETS Attuatore",
  PA_VALIDATOR: "PA Validatore",
  COMMUNITY_VALIDATOR: "Community Validator",
  AUDITOR: "Auditor",
};

export const ROLE_BADGE: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  TERRITORIAL_ANALYST: "bg-cyan-100 text-cyan-800 border-cyan-200",
  ORIGINATOR: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ANCHOR_COMPANY: "bg-orange-100 text-orange-800 border-orange-200",
  BANK_PROMOTER: "bg-blue-100 text-blue-800 border-blue-200",
  FUND_MANAGER: "bg-violet-100 text-violet-800 border-violet-200",
  ETS_IMPLEMENTER: "bg-teal-100 text-teal-800 border-teal-200",
  PA_VALIDATOR: "bg-indigo-100 text-indigo-800 border-indigo-200",
  COMMUNITY_VALIDATOR: "bg-lime-100 text-lime-800 border-lime-200",
  AUDITOR: "bg-slate-200 text-slate-700 border-slate-300",
};

/** Matrice permessi RBAC estesa (RF-2). Un utente può avere ruoli diversi su progetti diversi:
 *  qui modelliamo i permessi globali del ruolo selezionato nella sessione demo. */
const PERMS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  TERRITORIAL_ANALYST: [
    "opportunity.manage",
    "opportunity.view",
    "project.view",
    "agent.scout",
  ],
  ORIGINATOR: [
    "project.create",
    "project.edit",
    "project.advance",
    "project.view",
    "stakeholder.manage",
    "comment.add",
    "finance.edit",
    "opportunity.view",
    "opportunity.convert",
    "agent.all",
  ],
  ANCHOR_COMPANY: [
    "project.view",
    "resource.manage",
    "comment.add",
    "csrd.view",
  ],
  BANK_PROMOTER: [
    "project.view",
    "finance.edit",
    "underwriting.edit",
    "underwriting.view",
    "wallet.view",
    "portfolio.view",
    "agent.all",
  ],
  FUND_MANAGER: [
    "project.view",
    "finance.edit",
    "underwriting.view",
    "wallet.view",
    "wallet.mint",
    "deal.view",
    "agent.all",
  ],
  ETS_IMPLEMENTER: [
    "project.view",
    "kpi.submit",
    "evidence.submit",
    "comment.add",
  ],
  PA_VALIDATOR: [
    "project.view",
    "evidence.validate",
    "sib.validate",
    "audit.view",
  ],
  COMMUNITY_VALIDATOR: ["project.view", "community.vote", "comment.add"],
  AUDITOR: [
    "project.view",
    "evidence.validate",
    "audit.view",
    "audit.manage",
    "wallet.view",
  ],
};

export function hasPerm(role: UserRole, perm: string): boolean {
  const perms = PERMS[role] ?? [];
  return perms.includes("*") || perms.includes(perm);
}

export const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "TERRITORIAL_ANALYST",
  "ORIGINATOR",
  "ANCHOR_COMPANY",
  "BANK_PROMOTER",
  "FUND_MANAGER",
  "ETS_IMPLEMENTER",
  "PA_VALIDATOR",
  "COMMUNITY_VALIDATOR",
  "AUDITOR",
];
