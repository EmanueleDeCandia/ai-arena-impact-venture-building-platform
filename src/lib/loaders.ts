import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { EMPTY_CANVAS, EMPTY_TOC } from "@/lib/types";
import type {
  OpportunityDTO,
  ProjectDTO,
  ProjectListItemDTO,
  UserDTO,
} from "@/lib/types";
import { computeFinance, kpiProgress } from "@/lib/finance";

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

export async function loadUsers(): Promise<UserDTO[]> {
  const rows = await db.select().from(s.users).orderBy(asc(s.users.id));
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    orgName: u.orgName,
  }));
}

export async function loadOpportunities(): Promise<OpportunityDTO[]> {
  const rows = await db.select().from(s.opportunities).orderBy(desc(s.opportunities.opportunityScore));
  return rows.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    territory: o.territory,
    commune: o.commune,
    gravity: o.gravity,
    populationTarget: o.populationTarget,
    assets: o.assets,
    source: o.source,
    economicPotential: o.economicPotential,
    opportunityScore: o.opportunityScore,
    suggestedStakeholders: o.suggestedStakeholders,
    status: o.status,
    createdAt: iso(o.createdAt) ?? "",
  }));
}

export async function loadProjectDTO(id: number): Promise<ProjectDTO | null> {
  const rows = await db.select().from(s.projects).where(eq(s.projects.id, id)).limit(1);
  if (rows.length === 0) return null;
  const p = rows[0];

  const [
    stakeholders,
    tranches,
    kpis,
    docs,
    txs,
    tokens,
    comments,
    users,
  ] = await Promise.all([
    db.select().from(s.stakeholders).where(eq(s.stakeholders.projectId, id)).orderBy(asc(s.stakeholders.id)),
    db.select().from(s.tranches).where(eq(s.tranches.projectId, id)).orderBy(asc(s.tranches.waterfallOrder), asc(s.tranches.id)),
    db.select().from(s.kpis).where(eq(s.kpis.projectId, id)).orderBy(asc(s.kpis.id)),
    db.select().from(s.documents).where(eq(s.documents.projectId, id)).orderBy(desc(s.documents.uploadedAt)),
    db.select().from(s.walletTransactions).where(eq(s.walletTransactions.projectId, id)).orderBy(desc(s.walletTransactions.date)),
    db.select().from(s.impactTokens).where(eq(s.impactTokens.projectId, id)).orderBy(desc(s.impactTokens.issuedAt)),
    db.select().from(s.comments).where(eq(s.comments.projectId, id)).orderBy(desc(s.comments.createdAt)),
    db.select().from(s.users),
  ]);

  const kpiIds = kpis.map((k) => k.id);
  const evidenceRows =
    kpiIds.length > 0
      ? await db.select().from(s.evidences).where(inArray(s.evidences.kpiId, kpiIds)).orderBy(desc(s.evidences.submittedAt))
      : [];
  const userById = new Map(users.map((u) => [u.id, u]));
  const kpiById = new Map(kpis.map((k) => [k.id, k]));

  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    territory: p.territory,
    commune: p.commune,
    status: p.status,
    sdgTags: p.sdgTags,
    toc: p.toc ?? EMPTY_TOC,
    impactCanvas: p.impactCanvas ?? EMPTY_CANVAS,
    raci: p.raci ?? [],
    fundingNeed: p.fundingNeed,
    annualRevenue: p.annualRevenue,
    annualOpex: p.annualOpex,
    localSupplierPct: p.localSupplierPct,
    lm3: p.lm3,
    fteCreated: p.fteCreated,
    creditScore: p.creditScore,
    impactScore: p.impactScore,
    taxonomyAlignmentPct: p.taxonomyAlignmentPct,
    sfdrCategory: p.sfdrCategory,
    dnshOk: p.dnshOk,
    expectedLossPct: p.expectedLossPct,
    createdAt: iso(p.createdAt) ?? "",
    updatedAt: iso(p.updatedAt) ?? "",
    originatorName: p.originatorId ? (userById.get(p.originatorId)?.name ?? null) : null,
    opportunityTitle: null,
    stakeholders: stakeholders.map((st) => ({
      id: st.id,
      type: st.type,
      orgName: st.orgName,
      contactName: st.contactName,
      commitment: st.commitment,
      commitmentValue: st.commitmentValue,
      userId: st.userId,
    })),
    tranches: tranches.map((t) => ({
      id: t.id,
      instrument: t.instrument,
      label: t.label,
      provider: t.provider,
      amount: t.amount,
      ratePct: t.ratePct,
      maturityMonths: t.maturityMonths,
      guaranteePct: t.guaranteePct,
      waterfallOrder: t.waterfallOrder,
      conditions: t.conditions,
      status: t.status,
    })),
    kpis: kpis.map((k) => ({
      id: k.id,
      code: k.code,
      title: k.title,
      unit: k.unit,
      baseline: k.baseline,
      target: k.target,
      current: k.current,
      valuePerUnit: k.valuePerUnit,
      verificationMethod: k.verificationMethod,
      timelineMonths: k.timelineMonths,
      sdg: k.sdg,
    })),
    evidences: evidenceRows.map((e) => ({
      id: e.id,
      kpiId: e.kpiId,
      kpiTitle: kpiById.get(e.kpiId)?.title ?? "—",
      title: e.title,
      type: e.type,
      value: e.value,
      fileRef: e.fileRef,
      status: e.status,
      submittedBy: e.submittedBy,
      submittedByName: e.submittedBy ? (userById.get(e.submittedBy)?.name ?? null) : null,
      validatorNote: e.validatorNote,
      submittedAt: iso(e.submittedAt) ?? "",
      validatedAt: iso(e.validatedAt),
    })),
    documents: docs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      sizeKb: d.sizeKb,
      status: d.status,
      uploadedByName: d.uploadedBy ? (userById.get(d.uploadedBy)?.name ?? null) : null,
      uploadedAt: iso(d.uploadedAt) ?? "",
    })),
    transactions: txs.map((t) => ({
      id: t.id,
      type: t.type,
      fromEntity: t.fromEntity,
      toEntity: t.toEntity,
      amount: t.amount,
      note: t.note,
      hash: t.hash,
      trancheLabel: t.trancheId ? (tranches.find((tr) => tr.id === t.trancheId)?.label ?? null) : null,
      date: iso(t.date) ?? "",
    })),
    tokens: tokens.map((t) => ({
      id: t.id,
      kpiId: t.kpiId,
      amount: t.amount,
      description: t.description,
      issuedAt: iso(t.issuedAt) ?? "",
    })),
    comments: comments.map((c) => ({
      id: c.id,
      userName: c.userName,
      section: c.section,
      text: c.text,
      createdAt: iso(c.createdAt) ?? "",
    })),
  };
}

export async function loadProjectList(): Promise<ProjectListItemDTO[]> {
  const [projects, stakeholders, tranches, kpis] = await Promise.all([
    db.select().from(s.projects).orderBy(desc(s.projects.updatedAt)),
    db.select().from(s.stakeholders),
    db.select().from(s.tranches),
    db.select().from(s.kpis),
  ]);
  return projects.map((p) => {
    const st = stakeholders.filter((x) => x.projectId === p.id);
    const tr = tranches.filter((x) => x.projectId === p.id);
    const kp = kpis.filter((x) => x.projectId === p.id);
    const f = computeFinance(
      tr.map((t) => ({
        id: t.id,
        instrument: t.instrument,
        label: t.label,
        provider: t.provider,
        amount: t.amount,
        ratePct: t.ratePct,
        maturityMonths: t.maturityMonths,
        guaranteePct: t.guaranteePct,
        waterfallOrder: t.waterfallOrder,
        conditions: t.conditions,
        status: t.status,
      })),
      p
    );
    const avgProgress =
      kp.length > 0 ? kp.reduce((sum, k) => sum + kpiProgress(k), 0) / kp.length : 0;
    return {
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      territory: p.territory,
      status: p.status,
      sdgTags: p.sdgTags,
      createdAt: iso(p.createdAt) ?? "",
      stakeholderCount: st.length,
      fundingTotal: f.total,
      kpiAvgProgress: Math.round(avgProgress * 100),
    };
  });
}

export async function loadAudit(limit = 150) {
  const rows = await db.select().from(s.auditLog).orderBy(desc(s.auditLog.timestamp)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    details: r.details,
    timestamp: iso(r.timestamp) ?? "",
  }));
}

let seeding: Promise<void> | null = null;

/** Seeding automatico: garantisce schema e dati demo pronti anche su DB appena avviato. */
export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      try {
        const { ensureDbReady } = await import("@/db");
        await ensureDbReady();
        const count = await db.select().from(s.users).limit(1);
        if (count.length === 0) {
          const { seedDatabase } = await import("@/db/seed");
          await seedDatabase();
        }
      } catch (err) {
        seeding = null;
        console.error("ensureSeeded initialization error:", err);
        throw err;
      }
    })();
  }
  return seeding;
}
