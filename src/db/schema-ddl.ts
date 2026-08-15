// DDL SQL per inizializzazione automatica dello schema PostgreSQL / PGlite

export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"org_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"territory" text NOT NULL,
	"commune" text,
	"gravity" integer DEFAULT 5 NOT NULL,
	"population_target" text,
	"assets" text,
	"source" text DEFAULT 'ISTAT BES' NOT NULL,
	"economic_potential" real DEFAULT 0 NOT NULL,
	"opportunity_score" real DEFAULT 50 NOT NULL,
	"suggested_stakeholders" text[],
	"status" text DEFAULT 'RADAR' NOT NULL,
	"created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"territory" text NOT NULL,
	"commune" text,
	"status" text DEFAULT 'FOUNDRY_DRAFT' NOT NULL,
	"originator_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"opportunity_id" integer REFERENCES "opportunities"("id") ON DELETE SET NULL,
	"sdg_tags" text[],
	"toc" jsonb,
	"impact_canvas" jsonb,
	"raci" jsonb,
	"funding_need" real DEFAULT 0 NOT NULL,
	"annual_revenue" real DEFAULT 0 NOT NULL,
	"annual_opex" real DEFAULT 0 NOT NULL,
	"local_supplier_pct" real DEFAULT 0 NOT NULL,
	"lm3" real DEFAULT 0 NOT NULL,
	"fte_created" integer DEFAULT 0 NOT NULL,
	"credit_score" real DEFAULT 0 NOT NULL,
	"impact_score" real DEFAULT 0 NOT NULL,
	"taxonomy_alignment" real DEFAULT 0 NOT NULL,
	"sfdr_category" text DEFAULT 'Article 6' NOT NULL,
	"dnsh_ok" boolean DEFAULT false NOT NULL,
	"expected_loss_pct" real DEFAULT 0 NOT NULL,
	"sroi" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stakeholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"type" text NOT NULL,
	"org_name" text NOT NULL,
	"contact_name" text,
	"commitment" text,
	"commitment_value" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tranches" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"instrument" text NOT NULL,
	"label" text NOT NULL,
	"provider" text,
	"amount" real DEFAULT 0 NOT NULL,
	"rate_pct" real DEFAULT 0 NOT NULL,
	"maturity_months" integer DEFAULT 0 NOT NULL,
	"guarantee_pct" real DEFAULT 0 NOT NULL,
	"waterfall_order" integer DEFAULT 1 NOT NULL,
	"conditions" text,
	"status" text DEFAULT 'PROPOSED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"unit" text NOT NULL,
	"baseline" real DEFAULT 0 NOT NULL,
	"target" real DEFAULT 0 NOT NULL,
	"current" real DEFAULT 0 NOT NULL,
	"value_per_unit" real DEFAULT 0 NOT NULL,
	"verification_method" text,
	"timeline_months" integer DEFAULT 12 NOT NULL,
	"sdg" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "evidences" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_id" integer NOT NULL REFERENCES "kpis"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"type" text DEFAULT 'DOCUMENT' NOT NULL,
	"value" real DEFAULT 0 NOT NULL,
	"file_ref" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"submitted_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"validated_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"validator_note" text,
	"validated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"tranche_id" integer REFERENCES "tranches"("id") ON DELETE SET NULL,
	"type" text NOT NULL,
	"from_entity" text NOT NULL,
	"to_entity" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"note" text,
	"hash" text NOT NULL,
	"evidence_id" integer REFERENCES "evidences"("id") ON DELETE SET NULL,
	"date" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "impact_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"kpi_id" integer REFERENCES "kpis"("id") ON DELETE SET NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"category" text DEFAULT 'CONTRACT' NOT NULL,
	"size_kb" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"uploaded_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
	"user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"userName" text,
	"user_name" text NOT NULL,
	"section" text DEFAULT 'GENERAL' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "stakeholders_project_idx" ON "stakeholders" ("project_id");
CREATE INDEX IF NOT EXISTS "tranches_project_idx" ON "tranches" ("project_id");
CREATE INDEX IF NOT EXISTS "kpis_project_idx" ON "kpis" ("project_id");
CREATE INDEX IF NOT EXISTS "evidences_kpi_idx" ON "evidences" ("kpi_id");
CREATE INDEX IF NOT EXISTS "wallet_project_idx" ON "wallet_transactions" ("project_id");
CREATE INDEX IF NOT EXISTS "tokens_project_idx" ON "impact_tokens" ("project_id");
CREATE INDEX IF NOT EXISTS "documents_project_idx" ON "documents" ("project_id");
CREATE INDEX IF NOT EXISTS "comments_project_idx" ON "comments" ("project_id");
`;
