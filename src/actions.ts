"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as s from "@/db/schema";
import type { AgentName } from "@/lib/agents";
import { runAgentLogic } from "@/lib/agents";
import { EMPTY_CANVAS, EMPTY_TOC } from "@/lib/types";
import type { ImpactCanvas, RaciItem, ToC } from "@/db/schema";
import { loadProjectDTO, loadOpportunities } from "@/lib/loaders";
import { NEXT_STATUS, transitionChecks } from "@/lib/workflow";
import type { Instrument, StakeholderType } from "@/db/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function logAudit(actorId: number, action: string, entityType: string, entityId: number | null, details: string | null) {
  const u = await db.select().from(s.users).where(eq(s.users.id, actorId)).limit(1);
  await db.insert(s.auditLog).values({
    userId: actorId,
    userName: u[0]?.name ?? "Sistema",
    action,
    entityType,
    entityId,
    details,
  });
}

function revalidate(projectId?: number) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/opportunities");
  revalidatePath("/dashboard/ai");
  revalidatePath("/dashboard/audit");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// Progetti e workflow
// ---------------------------------------------------------------------------

export async function createProject(input: {
  name: string;
  description: string;
  territory: string;
  commune?: string;
  actorId: number;
}) {
  const rows = await db
    .insert(s.projects)
    .values({
      name: input.name,
      description: input.description,
      territory: input.territory,
      commune: input.commune || null,
      status: "FOUNDRY_DRAFT",
      originatorId: input.actorId,
      toc: EMPTY_TOC,
      impactCanvas: EMPTY_CANVAS,
      raci: [],
      sdgTags: [],
    })
    .returning();
  await logAudit(input.actorId, "CREA_FOUNDRY", "PROJECT", rows[0].id, `Creato Foundry "${input.name}"`);
  revalidate();
  return { ok: true, projectId: rows[0].id };
}

export type CreateProjectFullInput = {
  name: string;
  tagline?: string;
  description: string;
  territory: string;
  commune?: string;
  sdgTags?: string[];
  fundingNeed?: number;
  annualRevenue?: number;
  annualOpex?: number;
  // Pay for Success
  enablePfs?: boolean;
  pfsPayer?: string;
  pfsBudget?: number;
  // Outcome & KPI iniziale
  kpiTitle?: string;
  kpiUnit?: string;
  kpiTarget?: number;
  kpiValuePerUnit?: number;
  actorId: number;
};

export async function createProjectFull(input: CreateProjectFullInput) {
  const rows = await db
    .insert(s.projects)
    .values({
      name: input.name,
      tagline: input.tagline || null,
      description: input.description,
      territory: input.territory,
      commune: input.commune || null,
      status: "FOUNDRY_DRAFT",
      originatorId: input.actorId,
      sdgTags: input.sdgTags || [],
      fundingNeed: input.fundingNeed || 0,
      annualRevenue: input.annualRevenue || 0,
      annualOpex: input.annualOpex || 0,
      toc: EMPTY_TOC,
      impactCanvas: EMPTY_CANVAS,
      raci: [],
    })
    .returning();

  const projectId = rows[0].id;
  let createdKpiId: number | null = null;

  // Inserimento KPI primario iniziale
  if (input.kpiTitle && (input.kpiTarget ?? 0) > 0) {
    const kpiRows = await db
      .insert(s.kpis)
      .values({
        projectId,
        code: "KPI:1",
        title: input.kpiTitle,
        unit: input.kpiUnit || "unità",
        target: input.kpiTarget || 10,
        baseline: 0,
        current: 0,
        valuePerUnit: input.kpiValuePerUnit || 1000,
        verificationMethod: "MRV Engine — Validazione standard",
        timelineMonths: 24,
      })
      .returning();
    createdKpiId = kpiRows[0].id;
  }

  // Inserimento Tranche Pay for Success / SIB iniziale se abilitata
  if (input.enablePfs && (input.pfsBudget ?? 0) > 0) {
    const condStr = createdKpiId && input.kpiTarget ? `kpi:${createdKpiId} >= ${input.kpiTarget}` : undefined;
    await db.insert(s.tranches).values({
      projectId,
      instrument: "SIB",
      label: "Contratto Pay for Success (Outcome Payment)",
      provider: input.pfsPayer || "Outcome Payer (PA / Fondazione / Privato)",
      amount: input.pfsBudget || 100000,
      ratePct: 0,
      maturityMonths: 36,
      guaranteePct: 0,
      waterfallOrder: 1,
      conditions: condStr,
      status: "PROPOSED",
    });
  }

  await logAudit(
    input.actorId,
    "CREA_VENTURE_WIZARD",
    "PROJECT",
    projectId,
    `Creata nuova venture "${input.name}" (${input.territory})${input.enablePfs ? " con modulo Pay for Success" : ""}`
  );

  revalidate();
  return { ok: true, projectId };
}

export async function enablePayForSuccess(
  projectId: number,
  input: {
    payer: string;
    budget: number;
    targetUnits: number;
    kpiId?: number;
    newKpiTitle?: string;
    newKpiUnit?: string;
    valuePerUnit?: number;
  },
  actorId: number
) {
  let targetKpiId = input.kpiId;

  // Se è stato richiesto un nuovo KPI
  if (!targetKpiId && input.newKpiTitle) {
    const kpiRows = await db
      .insert(s.kpis)
      .values({
        projectId,
        code: `KPI:${Date.now().toString().slice(-4)}`,
        title: input.newKpiTitle,
        unit: input.newKpiUnit || "unità",
        target: input.targetUnits || 10,
        baseline: 0,
        current: 0,
        valuePerUnit: input.valuePerUnit || 1000,
        verificationMethod: "Stima Controfattuale / MRV Engine",
        timelineMonths: 24,
      })
      .returning();
    targetKpiId = kpiRows[0].id;
  } else if (targetKpiId && input.valuePerUnit) {
    await db.update(s.kpis).set({ valuePerUnit: input.valuePerUnit }).where(eq(s.kpis.id, targetKpiId));
  }

  const condStr = targetKpiId && input.targetUnits > 0 ? `kpi:${targetKpiId} >= ${input.targetUnits}` : undefined;

  // Inserisci tranche SIB
  await db.insert(s.tranches).values({
    projectId,
    instrument: "SIB",
    label: "Contratto Pay for Success (Outcome Payment)",
    provider: input.payer || "Outcome Payer (PA / Fondazione / Privato)",
    amount: input.budget,
    ratePct: 0,
    maturityMonths: 36,
    guaranteePct: 0,
    waterfallOrder: 1,
    conditions: condStr,
    status: "PROPOSED",
  });

  await logAudit(
    actorId,
    "ABILITA_PAY_FOR_SUCCESS",
    "PROJECT",
    projectId,
    `Attivato Pay for Success: ${input.budget.toLocaleString("it-IT")} € con ${input.payer}`
  );

  revalidate(projectId);
  return { ok: true };
}

export async function convertOpportunity(
  opportunityId: number,
  actorId: number
): Promise<{ ok: true; projectId: number } | { ok: false; error: string }> {
  const opp = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId)).limit(1);
  if (!opp[0]) return { ok: false, error: "Opportunità non trovata" };
  const o = opp[0];
  const rows = await db
    .insert(s.projects)
    .values({
      name: o.title,
      tagline: "Convertita da Opportunity Radar",
      description: o.description,
      territory: o.territory,
      commune: o.commune,
      status: "FOUNDRY_DRAFT",
      originatorId: actorId,
      opportunityId: o.id,
      toc: EMPTY_TOC,
      impactCanvas: EMPTY_CANVAS,
      raci: [],
      sdgTags: [],
    })
    .returning();
  await db.update(s.opportunities).set({ status: "CONVERTED" }).where(eq(s.opportunities.id, opportunityId));
  await logAudit(actorId, "CONVERTE_OPPORTUNITA", "PROJECT", rows[0].id, `Opportunità #${o.id} → Foundry "${o.title}"`);
  revalidate();
  return { ok: true, projectId: rows[0].id };
}

export async function advanceProject(projectId: number, actorId: number, force?: boolean) {
  const p = await loadProjectDTO(projectId);
  if (!p) return { ok: false, error: "Progetto non trovato" };
  const next = NEXT_STATUS[p.status];
  if (!next) return { ok: false, error: "Stato terminale raggiunto" };
  const checks = transitionChecks(p);
  const failed = checks.filter((c) => !c.passed);
  if (failed.length > 0 && !force) {
    return { ok: false, failedChecks: failed.map((f) => f.label) };
  }
  await db.update(s.projects).set({ status: next, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(
    actorId,
    force ? "AVANZA_STATO_OVERRIDE" : "AVANZA_STATO",
    "PROJECT",
    projectId,
    `${p.status} → ${next} ${force ? "(Forzatura Amministrativa)" : "(checklist superata)"}`
  );
  revalidate(projectId);
  return { ok: true, nextStatus: next };
}

export async function removeKpi(kpiId: number, actorId: number) {
  const kpi = await db.select().from(s.kpis).where(eq(s.kpis.id, kpiId)).limit(1);
  if (!kpi[0]) return { ok: false, error: "KPI non trovato" };
  await db.delete(s.kpis).where(eq(s.kpis.id, kpiId));
  await logAudit(actorId, "ELIMINA_KPI", "PROJECT", kpi[0].projectId, `Eliminato KPI "${kpi[0].title}"`);
  revalidate(kpi[0].projectId);
  return { ok: true };
}

export async function removeDocument(docId: number, actorId: number) {
  const doc = await db.select().from(s.documents).where(eq(s.documents.id, docId)).limit(1);
  if (!doc[0]) return { ok: false, error: "Documento non trovato" };
  await db.delete(s.documents).where(eq(s.documents.id, docId));
  await logAudit(actorId, "ELIMINA_DOCUMENTO", "PROJECT", doc[0].projectId, `Eliminato documento "${doc[0].title}"`);
  revalidate(doc[0].projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Foundry: ToC, canvas, RACI, commenti, stakeholder
// ---------------------------------------------------------------------------

export async function saveToc(
  projectId: number,
  toc: ToC,
  actorId: number
): Promise<{ ok: true; toc: ToC } | { ok: false; error: string }> {
  await db.update(s.projects).set({ toc, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, "AGGIORNA_TOC", "PROJECT", projectId, "Canvas Teoria del Cambiamento aggiornato");
  revalidate(projectId);
  return { ok: true, toc };
}

export async function validateToc(
  projectId: number,
  validated: boolean,
  actorId: number
): Promise<{ ok: true; toc: ToC } | { ok: false; error: string }> {
  const rows = await db.select().from(s.projects).where(eq(s.projects.id, projectId)).limit(1);
  if (!rows[0]) return { ok: false, error: "Progetto non trovato" };
  const toc: ToC = rows[0].toc ?? EMPTY_TOC;
  const updated: ToC = { ...toc, validated };
  await db.update(s.projects).set({ toc: updated, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, validated ? "VALIDA_TOC" : "RITIRA_VALIDAZIONE_TOC", "PROJECT", projectId, "Validazione multi-firma del canvas ToC");
  revalidate(projectId);
  return { ok: true, toc: updated };
}

export async function saveImpactCanvas(projectId: number, canvas: ImpactCanvas, actorId: number) {
  await db.update(s.projects).set({ impactCanvas: canvas, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, "AGGIORNA_BMC", "PROJECT", projectId, "Business Model Canvas a Impatto aggiornato");
  revalidate(projectId);
  return { ok: true };
}

export async function saveRaci(projectId: number, raci: RaciItem[], actorId: number) {
  await db.update(s.projects).set({ raci, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, "AGGIORNA_RACI", "PROJECT", projectId, `RACI aggiornato (${raci.length} work package)`);
  revalidate(projectId);
  return { ok: true };
}

export async function addComment(projectId: number, section: string, text: string, actorId: number) {
  const u = await db.select().from(s.users).where(eq(s.users.id, actorId)).limit(1);
  await db.insert(s.comments).values({
    projectId,
    userId: actorId,
    userName: u[0]?.name ?? "Utente",
    section,
    text,
  });
  await logAudit(actorId, "COMMENTA", "PROJECT", projectId, `Commento su ${section}`);
  revalidate(projectId);
  return { ok: true };
}

export async function addStakeholder(
  projectId: number,
  input: { type: StakeholderType; orgName: string; contactName?: string; commitment?: string; commitmentValue?: number },
  actorId: number
) {
  await db.insert(s.stakeholders).values({
    projectId,
    type: input.type,
    orgName: input.orgName,
    contactName: input.contactName || null,
    commitment: input.commitment || null,
    commitmentValue: input.commitmentValue ?? 0,
  });
  await logAudit(actorId, "INVITA_STAKEHOLDER", "PROJECT", projectId, `${input.orgName} (${input.type})`);
  revalidate(projectId);
  return { ok: true };
}

export async function removeStakeholder(stakeholderId: number, actorId: number) {
  const rows = await db.select().from(s.stakeholders).where(eq(s.stakeholders.id, stakeholderId)).limit(1);
  if (rows[0]) {
    await db.delete(s.stakeholders).where(eq(s.stakeholders.id, stakeholderId));
    await logAudit(actorId, "RIMUOVE_STAKEHOLDER", "PROJECT", rows[0].projectId, rows[0].orgName);
    revalidate(rows[0].projectId);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// RF-04 Blended Finance
// ---------------------------------------------------------------------------

export async function addTranche(
  projectId: number,
  input: {
    instrument: Instrument;
    label: string;
    provider?: string;
    amount: number;
    ratePct?: number;
    maturityMonths?: number;
    guaranteePct?: number;
    conditions?: string;
    waterfallOrder?: number;
  },
  actorId: number
) {
  await db.insert(s.tranches).values({
    projectId,
    instrument: input.instrument,
    label: input.label,
    provider: input.provider || null,
    amount: input.amount,
    ratePct: input.ratePct ?? 0,
    maturityMonths: input.maturityMonths ?? 0,
    guaranteePct: input.guaranteePct ?? 0,
    conditions: input.conditions || null,
    waterfallOrder: input.waterfallOrder ?? 1,
  });
  await logAudit(actorId, "AGGIUNGE_TRANCHE", "PROJECT", projectId, `${input.instrument}: ${input.label}`);
  revalidate(projectId);
  return { ok: true };
}

export async function removeTranche(trancheId: number, actorId: number) {
  const rows = await db.select().from(s.tranches).where(eq(s.tranches.id, trancheId)).limit(1);
  if (rows[0]) {
    await db.delete(s.tranches).where(eq(s.tranches.id, trancheId));
    await logAudit(actorId, "RIMUOVE_TRANCHE", "PROJECT", rows[0].projectId, rows[0].label);
    revalidate(rows[0].projectId);
  }
  return { ok: true };
}

export async function updateFinanceAssumptions(
  projectId: number,
  input: { fundingNeed: number; annualRevenue: number; annualOpex: number },
  actorId: number
) {
  await db.update(s.projects).set({ ...input, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, "AGGIORNA_ASSUZIONI_FIN", "PROJECT", projectId, "Aggiornate assunzioni finanziarie");
  revalidate(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// RF-08 KPI ed evidenze
// ---------------------------------------------------------------------------

export async function addKpi(
  projectId: number,
  input: {
    code: string;
    title: string;
    unit: string;
    baseline: number;
    target: number;
    valuePerUnit: number;
    verificationMethod: string;
    timelineMonths?: number;
    sdg?: string;
  },
  actorId: number
) {
  await db.insert(s.kpis).values({
    projectId,
    code: input.code,
    title: input.title,
    unit: input.unit,
    baseline: input.baseline,
    target: input.target,
    current: input.baseline,
    valuePerUnit: input.valuePerUnit,
    verificationMethod: input.verificationMethod,
    timelineMonths: input.timelineMonths ?? 24,
    sdg: input.sdg || null,
  });
  await logAudit(actorId, "AGGIUNGE_KPI", "PROJECT", projectId, `${input.code} — ${input.title}`);
  revalidate(projectId);
  return { ok: true };
}

export async function addEvidence(
  kpiId: number,
  input: { title: string; type: string; value: number; fileRef?: string },
  actorId: number
) {
  const kpi = await db.select().from(s.kpis).where(eq(s.kpis.id, kpiId)).limit(1);
  if (!kpi[0]) return { ok: false, error: "KPI non trovato" };
  await db.insert(s.evidences).values({
    kpiId,
    title: input.title,
    type: input.type,
    value: input.value,
    fileRef: input.fileRef || null,
    status: "PENDING",
    submittedBy: actorId,
  });
  await logAudit(actorId, "INVIO_EVIDENZA", "KPI", kpiId, input.title);
  revalidate(kpi[0].projectId);
  return { ok: true };
}

export async function validateEvidence(
  evidenceId: number,
  decision: "APPROVED" | "REJECTED",
  note: string,
  actorId: number
) {
  const ev = await db.select().from(s.evidences).where(eq(s.evidences.id, evidenceId)).limit(1);
  if (!ev[0]) return { ok: false, error: "Evidenza non trovata" };
  const e = ev[0];
  const wasApproved = e.status === "APPROVED";
  await db
    .update(s.evidences)
    .set({ status: decision, validatedBy: actorId, validatorNote: note || null, validatedAt: new Date() })
    .where(eq(s.evidences.id, evidenceId));

  const kpi = await db.select().from(s.kpis).where(eq(s.kpis.id, e.kpiId)).limit(1);
  if (kpi[0]) {
    let delta = 0;
    if (decision === "APPROVED" && !wasApproved) delta = e.value;
    if (decision === "REJECTED" && wasApproved) delta = -e.value;
    if (delta !== 0) {
      await db.update(s.kpis).set({ current: kpi[0].current + delta }).where(eq(s.kpis.id, e.kpiId));
    }
    if (decision === "APPROVED" && !wasApproved && e.value > 0) {
      await db.insert(s.impactTokens).values({
        projectId: kpi[0].projectId,
        kpiId: e.kpiId,
        amount: e.value,
        description: `1 token = 1 unità verificata di "${kpi[0].title}"`,
      });
      await db.insert(s.walletTransactions).values({
        projectId: kpi[0].projectId,
        type: "OUTCOME_VERIFICATION",
        fromEntity: "MRV Engine",
        toEntity: "Wallet d'impatto",
        amount: e.value,
        note: `${e.value} outcome verificati → token coniati`,
        hash: `0x${Math.random().toString(16).slice(2, 18)}`,
        evidenceId: e.id,
      });
    }
  }
  await logAudit(actorId, decision === "APPROVED" ? "VALIDA_EVIDENZA" : "RESPINGE_EVIDENZA", "EVIDENCE", evidenceId, note);
  revalidate(kpi[0]?.projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// RF-06 Deal Room
// ---------------------------------------------------------------------------

export async function addDocument(
  projectId: number,
  input: { title: string; category: string; sizeKb?: number },
  actorId: number
) {
  await db.insert(s.documents).values({
    projectId,
    title: input.title,
    category: input.category,
    sizeKb: input.sizeKb ?? 0,
    uploadedBy: actorId,
  });
  await logAudit(actorId, "CARICA_DOCUMENTO", "PROJECT", projectId, input.title);
  revalidate(projectId);
  return { ok: true };
}

export async function signDocument(documentId: number, actorId: number) {
  const d = await db.select().from(s.documents).where(eq(s.documents.id, documentId)).limit(1);
  if (!d[0]) return { ok: false, error: "Documento non trovato" };
  await db.update(s.documents).set({ status: "SIGNED" }).where(eq(s.documents.id, documentId));
  await logAudit(actorId, "FIRMA_DOCUMENTO", "DOCUMENT", documentId, `${d[0].title} — firma elettronica (mock DocuSign)`);
  revalidate(d[0].projectId);
  return { ok: true };
}

export async function generateAndSignTermSheet(projectId: number, actorId: number) {
  const p = await db.select().from(s.projects).where(eq(s.projects.id, projectId)).limit(1);
  const title = p[0] ? `Term Sheet Blended Finance — ${p[0].name}` : `Term Sheet Blended Finance`;
  
  const existing = await db
    .select()
    .from(s.documents)
    .where(and(eq(s.documents.projectId, projectId), eq(s.documents.category, "TERM_SHEET")))
    .limit(1);

  if (existing[0]) {
    await db.update(s.documents).set({ status: "SIGNED" }).where(eq(s.documents.id, existing[0].id));
    await logAudit(actorId, "FIRMA_DOCUMENTO", "DOCUMENT", existing[0].id, `${existing[0].title} — firmato (1-click)`);
  } else {
    await db.insert(s.documents).values({
      projectId,
      title,
      category: "TERM_SHEET",
      status: "SIGNED",
      sizeKb: 240,
      uploadedBy: actorId,
    });
    await logAudit(actorId, "CREA_E_FIRMA_TERM_SHEET", "PROJECT", projectId, `${title} generato e firmato digitalmente`);
  }
  revalidate(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// RF-01 Opportunità
// ---------------------------------------------------------------------------

export async function addOpportunity(
  input: {
    title: string;
    description: string;
    territory: string;
    commune?: string;
    gravity: number;
    populationTarget?: string;
    assets?: string;
    source: string;
    economicPotential: number;
  },
  actorId: number
) {
  const score = Math.min(
    100,
    Math.round(input.gravity * 7 + Math.min(25, (input.economicPotential / 1_000_000) * 8) + (input.assets ? 10 : 0))
  );
  await db.insert(s.opportunities).values({
    title: input.title,
    description: input.description,
    territory: input.territory,
    commune: input.commune || null,
    gravity: input.gravity,
    populationTarget: input.populationTarget || null,
    assets: input.assets || null,
    source: input.source,
    economicPotential: input.economicPotential,
    opportunityScore: score,
    createdBy: actorId,
  });
  await logAudit(actorId, "CREA_OPPORTUNITA", "OPPORTUNITY", null, input.title);
  revalidate();
  return { ok: true, score };
}

// ---------------------------------------------------------------------------
// RF-09 Wallet
// ---------------------------------------------------------------------------

export async function mintToken(projectId: number, kpiId: number | null, amount: number, description: string, actorId: number) {
  await db.insert(s.impactTokens).values({ projectId, kpiId, amount, description });
  await db.insert(s.walletTransactions).values({
    projectId,
    type: "OUTCOME_VERIFICATION",
    fromEntity: "MRV Engine",
    toEntity: "Wallet d'impatto",
    amount,
    note: description,
    hash: `0x${Math.random().toString(16).slice(2, 18)}`,
  });
  await logAudit(actorId, "CONIA_TOKEN", "PROJECT", projectId, `${amount} token: ${description}`);
  revalidate(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// RF-07 Multi-Agent AI
// ---------------------------------------------------------------------------

export async function runAgent(
  agent: AgentName,
  ctx: { projectId?: number; opportunityId?: number; audience?: string },
  actorId: number
) {
  const project = ctx.projectId ? await loadProjectDTO(ctx.projectId) : null;
  let projects = undefined;
  if (agent === "architect") {
    const list = await db.select().from(s.projects).orderBy(desc(s.projects.updatedAt));
    const dtos = [];
    for (const row of list) {
      const dto = await loadProjectDTO(row.id);
      if (dto) dtos.push(dto);
    }
    projects = dtos;
  }
  const opportunities = ctx.opportunityId ? await loadOpportunities() : [];
  const opportunity = ctx.opportunityId ? opportunities.find((o) => o.id === ctx.opportunityId) ?? null : null;

  const result = runAgentLogic(agent, { project, projects, opportunity, audience: ctx.audience });
  await logAudit(actorId, "ESEGUE_AGENTE", ctx.projectId ? "PROJECT" : "OPPORTUNITY", ctx.projectId ?? ctx.opportunityId ?? null, `${agent}: ${result.title}`);
  return result;
}

export async function applyAgentProposal(
  projectId: number,
  kind: "structurer" | "underwriter",
  actorId: number
) {
  const p = await loadProjectDTO(projectId);
  if (!p) return { ok: false, error: "Progetto non trovato" };
  if (kind === "structurer") {
    const result = runAgentLogic("structurer", { project: p });
    const proposed = result.payload.proposedTranches as Array<{
      instrument: Instrument;
      label: string;
      provider: string;
      amount: number;
      ratePct: number;
      maturityMonths: number;
      guaranteePct: number;
      waterfallOrder: number;
      conditions: string | null;
    }>;
    await db.delete(s.tranches).where(eq(s.tranches.projectId, projectId));
    for (let i = 0; i < proposed.length; i++) {
      const t = proposed[i];
      await db.insert(s.tranches).values({
        projectId,
        instrument: t.instrument,
        label: t.label,
        provider: t.provider,
        amount: t.amount,
        ratePct: t.ratePct,
        maturityMonths: t.maturityMonths,
        guaranteePct: t.guaranteePct,
        waterfallOrder: i + 1,
        conditions: t.conditions,
      });
    }
    await logAudit(actorId, "APPLICA_STRUTTURA", "PROJECT", projectId, `Structurer Agent: ${proposed.length} tranche sostituite`);
  } else {
    const result = runAgentLogic("underwriter", { project: p });
    const payload = result.payload as { creditScore: number; impactScore: number; expectedLossPct: number };
    await db
      .update(s.projects)
      .set({ creditScore: payload.creditScore, impactScore: payload.impactScore, expectedLossPct: payload.expectedLossPct, updatedAt: new Date() })
      .where(eq(s.projects.id, projectId));
    await logAudit(actorId, "APPLICA_UNDERWRITING", "PROJECT", projectId, `Underwriter Agent: score integrato aggiornato`);
  }
  revalidate(projectId);
  return { ok: true };
}

export async function setDnsh(projectId: number, dnshOk: boolean, actorId: number) {
  await db.update(s.projects).set({ dnshOk, updatedAt: new Date() }).where(eq(s.projects.id, projectId));
  await logAudit(actorId, dnshOk ? "ATTIVA_DNSH" : "DISATTIVA_DNSH", "PROJECT", projectId, "Verifica DNSH aggiornata");
  revalidate(projectId);
  return { ok: true };
}

export async function updateUnderwriting(
  projectId: number,
  input: {
    creditScore: number;
    impactScore: number;
    taxonomyAlignmentPct: number;
    sfdrCategory: string;
    expectedLossPct?: number;
  },
  actorId: number
) {
  await db
    .update(s.projects)
    .set({
      creditScore: input.creditScore,
      impactScore: input.impactScore,
      taxonomyAlignmentPct: input.taxonomyAlignmentPct,
      sfdrCategory: input.sfdrCategory,
      expectedLossPct: input.expectedLossPct !== undefined ? input.expectedLossPct : 0,
      updatedAt: new Date(),
    })
    .where(eq(s.projects.id, projectId));
  await logAudit(
    actorId,
    "AGGIORNA_UNDERWRITING",
    "PROJECT",
    projectId,
    `Underwriting aggiornato: Credit ${input.creditScore}, Impact ${input.impactScore}, Tassonomia ${input.taxonomyAlignmentPct}%, SFDR ${input.sfdrCategory}`
  );
  revalidate(projectId);
  return { ok: true };
}

export async function saveOutcomeValuation(
  projectId: number,
  kpiId: number,
  grossValuePerUnit: number,
  methodologyNotes: string,
  evidenceType: string,
  actorId: number
) {
  await db
    .update(s.kpis)
    .set({
      valuePerUnit: grossValuePerUnit,
      verificationMethod: `Stima controfattuale: ${evidenceType} — ${methodologyNotes}`,
    })
    .where(eq(s.kpis.id, kpiId));

  await logAudit(
    actorId,
    "STIMA_VALORE_OUTCOME",
    "KPI",
    kpiId,
    `Valore unitario aggiornato a ${Math.round(grossValuePerUnit).toLocaleString("it-IT")} €/un. [${evidenceType}]: ${methodologyNotes}`
  );

  revalidate(projectId);
  return { ok: true };
}

