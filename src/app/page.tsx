import Link from "next/link";
import {
  ArrowRight,
  BadgeEuro,
  Bot,
  Building2,
  Coins,
  Gauge,
  Handshake,
  MapPin,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { ensureSeeded, loadProjectList } from "@/lib/loaders";
import { db } from "@/db";
import { projects, kpis, impactTokens } from "@/db/schema";
import { count } from "drizzle-orm";
import { fmtEURCompact, fmtNum } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const CHAIN = ["Bisogno territoriale", "Opportunità", "Coalizione multi-stakeholder", "Blended Finance", "Venture", "Impatto + Exit"];

const MODULES = [
  "RF-01 Need Sensing", "RF-02 Project Foundry", "RF-03 Resource Matching", "RF-04 Blended Finance",
  "RF-05 Impact Underwriting", "RF-06 Deal Room", "RF-07 Local Multiplier LM3", "RF-08 Social Impact MRV",
  "RF-09 Ecosystem Wallet", "RF-10 Investor Portal", "RF-11 Community Ownership", "RF-12 RegTech & Audit",
];

export default async function LandingPage() {
  await ensureSeeded();
  const list = await loadProjectList();
  const [{ value: projectCount }] = await db.select({ value: count() }).from(projects);
  const kpiRows = await db.select().from(kpis);
  const tokenRows = await db.select().from(impactTokens);

  const fundingTotal = list.reduce((s, p) => s + p.fundingTotal, 0);

  const sroiValues = list.map((p) => {
    const kp = kpiRows.filter((k) => k.projectId === p.id);
    const social = kp.reduce((s, k) => s + k.current * k.valuePerUnit, 0) * 5;
    return p.fundingTotal > 0 ? (social - p.fundingTotal) / p.fundingTotal : 0;
  });
  const avgSroi = sroiValues.length > 0 ? sroiValues.reduce((s, v) => s + v, 0) / sroiValues.length : 0;
  const tokenSum = tokenRows.reduce((s, t) => s + t.amount, 0);

  const featured = list.filter((p) => p.status === "EXECUTION" || p.status === "MRV_MONITORING").slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-black tracking-widest text-white">IMPACT FORGE</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Venture Building OS</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 sm:block">
            Area pubblica — accesso anonimo (RF-12.2)
          </span>
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Accedi alla piattaforma
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/images/hero-territory.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <Radar className="h-3.5 w-3.5" /> System of Creation & Orchestration — oltre il System of Record
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
            Dal bisogno territoriale alla{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              venture d'impatto finanziabile
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Impact Forge origina opportunità da open data, orchestria coalizioni multi-stakeholder, struttura finanza
            blended e misura l'impatto con SROI dinamico e moltiplicatore economico locale LM3.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
              Entra nella piattaforma <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <a href="#progetti" className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800">
              Progetti sul territorio
            </a>
          </div>

          {/* Catena del valore */}
          <div className="mt-12 flex flex-wrap items-center gap-2">
            {CHAIN.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span
                  className={
                    i === CHAIN.length - 1
                      ? "rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300"
                      : "rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-300"
                  }
                >
                  {step}
                </span>
                {i < CHAIN.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-600" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {[
            { icon: Target, label: "Progetti orchestrati", value: fmtNum(projectCount) },
            { icon: BadgeEuro, label: "Funding strutturato", value: fmtEURCompact(fundingTotal) },
            { icon: TrendingUp, label: "SROI medio dinamico", value: avgSroi.toFixed(2) },
            { icon: Coins, label: "Token d'impatto coniati", value: fmtNum(tokenSum) },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Confronto */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-black text-white">Perché non è un System of Record</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Le piattaforme legacy amministrano grant già decisi. Impact Forge li origina e li struttura in venture.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Dimensione</th>
                <th className="px-5 py-3">Bonterra (Deed / CyberGrants)</th>
                <th className="px-5 py-3 text-emerald-300">IMPACT FORGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {[
                ["Unità fondamentale", "Grant / Relationship", "Venture / Deal"],
                ["Core workflow", "Application → Review → Disbursement → Report", "Sensing → Co-design → Structuring → Underwriting → Funding → MRV → Exit"],
                ["Finanza", "Solo grant", "Grant + Debt senior + Agevolato + Garanzia FEI/MCC + Equity + SIB"],
                ["Calcolo impatto", "Activity reporting (ore, €)", "Impact Underwriting + SROI dinamico + LM3"],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="px-5 py-3.5 font-semibold text-slate-200">{row[0]}</td>
                  <td className="px-5 py-3.5 text-slate-500">{row[1]}</td>
                  <td className="px-5 py-3.5 font-medium text-emerald-300">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Progetti pubblici */}
      <section id="progetti" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Venture in execution sul territorio</h2>
          <span className="text-xs text-slate-500">Dati aggregati — area pubblica</span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {featured.map((p) => (
            <Link
              key={p.id}
              href="/dashboard"
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  {STATUS_LABEL[p.status]}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5" /> {p.territory}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-white group-hover:text-emerald-300">{p.name}</h3>
              <p className="mt-1 text-xs text-slate-400">{p.tagline}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-bold text-white">{fmtEURCompact(p.fundingTotal)}</span>
                <span className="text-xs text-slate-400">{p.stakeholderCount} stakeholder</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Avanzamento KPI</span>
                  <span>{p.kpiAvgProgress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.kpiAvgProgress}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Moduli */}
      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-black text-white">12 moduli funzionali, 5 livelli architetturali</h2>
          <p className="mt-2 text-sm text-slate-400">
            Multi-tenant · event-driven · ogni entità è audited (created_by, updated_by, validato) · privacy by design.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {MODULES.map((m) => (
              <span key={m} className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300">
                {m}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { icon: Bot, label: "6 agenti AI con Cited Reasoning" },
              { icon: Gauge, label: "Underwriting credito + impatto" },
              { icon: Handshake, label: "Coalizioni multi-stakeholder" },
              { icon: Users, label: "RBAC esteso a 10 ruoli" },
              { icon: Building2, label: "Portali per Banca, Fondo, Anchor" },
            ].map((f) => (
              <span key={f.label} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300">
                <f.icon className="h-4 w-4 text-emerald-400" /> {f.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        IMPACT FORGE v1.0 · Impact Management Platform · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
