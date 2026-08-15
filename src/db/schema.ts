import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Tipi di dominio (RF-2 Attori e Ruoli, RF-4 Strumenti, RF-5/8/9 entità)
// ---------------------------------------------------------------------------

export type UserRole =
  | "SUPER_ADMIN"
  | "TERRITORIAL_ANALYST"
  | "ORIGINATOR"
  | "ANCHOR_COMPANY"
  | "BANK_PROMOTER"
  | "FUND_MANAGER"
  | "ETS_IMPLEMENTER"
  | "PA_VALIDATOR"
  | "COMMUNITY_VALIDATOR"
  | "AUDITOR";

export type ProjectStatus =
  | "OPPORTUNITY"
  | "FOUNDRY_DRAFT"
  | "CO_DESIGN"
  | "STRUCTURED"
  | "UNDERWRITING"
  | "FUNDING_COMMITTED"
  | "EXECUTION"
  | "MRV_MONITORING"
  | "EXIT_SCALE";

export type StakeholderType =
  | "ANCHOR_COMPANY"
  | "BANK_PROMOTER"
  | "FUND_MANAGER"
  | "ETS_IMPLEMENTER"
  | "PA_VALIDATOR"
  | "COMMUNITY_VALIDATOR"
  | "TECH_PARTNER";

export type Instrument =
  | "GRANT"
  | "CONCESSIONAL_LOAN"
  | "SENIOR_DEBT"
  | "GUARANTEE"
  | "EQUITY"
  | "SIB"
  | "REVENUE_SHARE"
  | "COMMUNITY_SHARES";

export type TrancheStatus = "PROPOSED" | "COMMITTED" | "DISBURSED" | "REPAID";
export type EvidenceStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DocStatus = "DRAFT" | "SIGNED" | "ARCHIVED";
export type OpportunityStatus = "RADAR" | "VALIDATED" | "CONVERTED" | "CLOSED";
export type TxType =
  | "COMMITMENT"
  | "DISBURSEMENT"
  | "EXPENSE"
  | "OUTCOME_VERIFICATION";

export type ToC = {
  inputs: string[];
  activities: string[];
  outputs: string[];
  outcomes: string[];
  impacts: string[];
  validated: boolean;
};

export type ImpactCanvas = {
  costStructure: string[];
  revenueStreams: string[];
  payingBeneficiaries: string;
  nonPayingBeneficiaries: string;
  keyPartners: string[];
  keyResources: string[];
};

export type RaciItem = { wp: string; r: string; a: string; c: string; i: string };

// ---------------------------------------------------------------------------
// Tabelle
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  orgName: text("org_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  territory: text("territory").notNull(),
  commune: text("commune"),
  gravity: integer("gravity").notNull().default(5),
  populationTarget: text("population_target"),
  assets: text("assets"),
  source: text("source").notNull().default("ISTAT BES"),
  economicPotential: real("economic_potential").notNull().default(0),
  opportunityScore: real("opportunity_score").notNull().default(50),
  suggestedStakeholders: text("suggested_stakeholders").array(),
  status: text("status").$type<OpportunityStatus>().notNull().default("RADAR"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  territory: text("territory").notNull(),
  commune: text("commune"),
  status: text("status").$type<ProjectStatus>().notNull().default("FOUNDRY_DRAFT"),
  originatorId: integer("originator_id").references(() => users.id),
  opportunityId: integer("opportunity_id").references(() => opportunities.id),
  sdgTags: text("sdg_tags").array(),
  // RF-02 Foundry
  toc: jsonb("toc").$type<ToC>(),
  impactCanvas: jsonb("impact_canvas").$type<ImpactCanvas>(),
  raci: jsonb("raci").$type<RaciItem[]>(),
  // RF-04 Assunzioni finanziarie
  fundingNeed: real("funding_need").notNull().default(0),
  annualRevenue: real("annual_revenue").notNull().default(0),
  annualOpex: real("annual_opex").notNull().default(0),
  // RF-07 Local multiplier
  localSupplierPct: real("local_supplier_pct").notNull().default(0),
  lm3: real("lm3").notNull().default(0),
  fteCreated: integer("fte_created").notNull().default(0),
  // RF-05 Underwriting
  creditScore: real("credit_score").notNull().default(0),
  impactScore: real("impact_score").notNull().default(0),
  taxonomyAlignmentPct: real("taxonomy_alignment").notNull().default(0),
  sfdrCategory: text("sfdr_category").notNull().default("Article 6"),
  dnshOk: boolean("dnsh_ok").notNull().default(false),
  expectedLossPct: real("expected_loss_pct").notNull().default(0),
  sroi: real("sroi").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stakeholders = pgTable(
  "stakeholders",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id),
    type: text("type").$type<StakeholderType>().notNull(),
    orgName: text("org_name").notNull(),
    contactName: text("contact_name"),
    commitment: text("commitment"),
    commitmentValue: real("commitment_value").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("stakeholders_project_idx").on(t.projectId)]
);

export const tranches = pgTable(
  "tranches",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    instrument: text("instrument").$type<Instrument>().notNull(),
    label: text("label").notNull(),
    provider: text("provider"),
    amount: real("amount").notNull().default(0),
    ratePct: real("rate_pct").notNull().default(0),
    maturityMonths: integer("maturity_months").notNull().default(0),
    guaranteePct: real("guarantee_pct").notNull().default(0),
    waterfallOrder: integer("waterfall_order").notNull().default(1),
    conditions: text("conditions"),
    status: text("status").$type<TrancheStatus>().notNull().default("PROPOSED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("tranches_project_idx").on(t.projectId)]
);

export const kpis = pgTable(
  "kpis",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    unit: text("unit").notNull(),
    baseline: real("baseline").notNull().default(0),
    target: real("target").notNull().default(0),
    current: real("current").notNull().default(0),
    valuePerUnit: real("value_per_unit").notNull().default(0),
    verificationMethod: text("verification_method"),
    timelineMonths: integer("timeline_months").notNull().default(12),
    sdg: text("sdg"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("kpis_project_idx").on(t.projectId)]
);

export const evidences = pgTable(
  "evidences",
  {
    id: serial("id").primaryKey(),
    kpiId: integer("kpi_id")
      .notNull()
      .references(() => kpis.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").notNull().default("DOCUMENT"),
    value: real("value").notNull().default(0),
    fileRef: text("file_ref"),
    status: text("status").$type<EvidenceStatus>().notNull().default("PENDING"),
    submittedBy: integer("submitted_by").references(() => users.id),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    validatedBy: integer("validated_by").references(() => users.id),
    validatorNote: text("validator_note"),
    validatedAt: timestamp("validated_at"),
  },
  (t) => [index("evidences_kpi_idx").on(t.kpiId)]
);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    trancheId: integer("tranche_id").references(() => tranches.id),
    type: text("type").$type<TxType>().notNull(),
    fromEntity: text("from_entity").notNull(),
    toEntity: text("to_entity").notNull(),
    amount: real("amount").notNull().default(0),
    note: text("note"),
    hash: text("hash").notNull(),
    evidenceId: integer("evidence_id").references(() => evidences.id),
    date: timestamp("date").defaultNow().notNull(),
  },
  (t) => [index("wallet_project_idx").on(t.projectId)]
);

export const impactTokens = pgTable(
  "impact_tokens",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kpiId: integer("kpi_id").references(() => kpis.id),
    amount: real("amount").notNull().default(0),
    description: text("description").notNull(),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
  },
  (t) => [index("tokens_project_idx").on(t.projectId)]
);

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull().default("CONTRACT"),
    sizeKb: integer("size_kb").notNull().default(0),
    status: text("status").$type<DocStatus>().notNull().default("DRAFT"),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (t) => [index("documents_project_idx").on(t.projectId)]
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id),
    userName: text("user_name").notNull(),
    section: text("section").notNull().default("GENERAL"),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("comments_project_idx").on(t.projectId)]
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Stakeholder = typeof stakeholders.$inferSelect;
export type Tranche = typeof tranches.$inferSelect;
export type Kpi = typeof kpis.$inferSelect;
export type Evidence = typeof evidences.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type ImpactToken = typeof impactTokens.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
