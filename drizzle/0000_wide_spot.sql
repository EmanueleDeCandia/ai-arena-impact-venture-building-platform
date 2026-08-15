CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer,
	"user_name" text NOT NULL,
	"section" text DEFAULT 'GENERAL' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'CONTRACT' NOT NULL,
	"size_kb" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidences" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_id" integer NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'DOCUMENT' NOT NULL,
	"value" real DEFAULT 0 NOT NULL,
	"file_ref" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"submitted_by" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"validated_by" integer,
	"validator_note" text,
	"validated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "impact_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kpi_id" integer,
	"amount" real DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "opportunities" (
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
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"territory" text NOT NULL,
	"commune" text,
	"status" text DEFAULT 'FOUNDRY_DRAFT' NOT NULL,
	"originator_id" integer,
	"opportunity_id" integer,
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
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer,
	"type" text NOT NULL,
	"org_name" text NOT NULL,
	"contact_name" text,
	"commitment" text,
	"commitment_value" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tranches" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"org_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"tranche_id" integer,
	"type" text NOT NULL,
	"from_entity" text NOT NULL,
	"to_entity" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"note" text,
	"hash" text NOT NULL,
	"evidence_id" integer,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_tokens" ADD CONSTRAINT "impact_tokens_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_tokens" ADD CONSTRAINT "impact_tokens_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_originator_id_users_id_fk" FOREIGN KEY ("originator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tranches" ADD CONSTRAINT "tranches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_tranche_id_tranches_id_fk" FOREIGN KEY ("tranche_id") REFERENCES "public"."tranches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_evidence_id_evidences_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_project_idx" ON "comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "documents_project_idx" ON "documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "evidences_kpi_idx" ON "evidences" USING btree ("kpi_id");--> statement-breakpoint
CREATE INDEX "tokens_project_idx" ON "impact_tokens" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "kpis_project_idx" ON "kpis" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "stakeholders_project_idx" ON "stakeholders" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tranches_project_idx" ON "tranches" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "wallet_project_idx" ON "wallet_transactions" USING btree ("project_id");