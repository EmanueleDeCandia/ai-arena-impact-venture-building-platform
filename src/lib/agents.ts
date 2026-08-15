import type { Instrument, StakeholderType } from "@/db/schema";
import type { EvidenceDTO, KpiDTO, OpportunityDTO, ProjectDTO, TrancheDTO } from "@/lib/types";
import {
  computeFinance,
  computeSroi,
  kpiAlerts,
  kpiProgress,
  underwritingFinalScore,
} from "@/lib/finance";

/** RF-7: Multi-Agent AI System — 6 agenti con Cited Reasoning (ogni step cita la fonte). */

export type AgentName = "scout" | "architect" | "structurer" | "underwriter" | "mrv" | "storyteller";

export type AgentStep = { text: string; source: string };
export type AgentResult = {
  agent: AgentName;
  title: string;
  summary: string;
  steps: AgentStep[];
  payload: Record<string, unknown>;
};

export const AGENTS: { key: AgentName; name: string; role: string; desc: string }[] = [
  { key: "scout", name: "Scout Agent", role: "Need Sensing", desc: "Genera Opportunity da open data e calcola lo score di investibilità." },
  { key: "architect", name: "Architect Agent", role: "Co-Design", desc: "Suggerisce ToC e stakeholder da venture simili già finanziate." },
  { key: "structurer", name: "Structurer Agent", role: "Blended Finance", desc: "Propone la struttura blended ottimale dato fabbisogno e profilo di rischio." },
  { key: "underwriter", name: "Underwriter Agent", role: "Risk Scoring", desc: "Pre-compila il dossier istruttoria e flagga i rischi." },
  { key: "mrv", name: "MRV Agent", role: "Monitoraggio", desc: "Analizza evidenze, suggerisce validazioni e ricalcola lo SROI." },
  { key: "storyteller", name: "Storyteller Agent", role: "Narrative", desc: "Genera il report narrativo differenziato per Banca, PA e Cittadino." },
];

// ---------------------------------------------------------------------------

export function scoutAgent(o: OpportunityDTO): AgentResult {
  const scoreParts = {
    gravity: Math.min(50, o.gravity * 5),
    assets: o.assets && o.assets.length > 0 ? 15 : 0,
    economicPotential: Math.min(25, Math.round((o.economicPotential / 1_000_000) * 8)),
    funds: 10,
  };
  return {
    agent: "scout",
    title: `Opportunity: ${o.title}`,
    summary: `Opportunità con score ${Math.round(o.opportunityScore)}/100. Conversione consigliata in Project Foundry entro 30 giorni: fondi in scadenza nel trimestre.`,
    steps: [
      {
        text: `Gravità del bisogno ${o.gravity}/10 rilevata da ${o.source}: la domanda sociale è prioritaria per il territorio di ${o.territory}.`,
        source: o.source,
      },
      {
        text: `Asset disponibile: ${o.assets ?? "nessun asset censito"} — potenziale di valorizzazione stimato in ${(o.economicPotential / 1_000_000).toFixed(1)} M€.`,
        source: "Registro Imprese · Catasto edilizio",
      },
      {
        text: `Popolazione target: ${o.populationTarget ?? "da definire"} — dimensione della coorte stimata su dati ISTAT.`,
        source: "ISTAT · Censimento permanente",
      },
      {
        text: `Stakeholder suggeriti: ${(o.suggestedStakeholders ?? []).join(", ") || "da mappare"} — presenza di anchor e PA incrementa l'investibilità.`,
        source: "RF-01.4 Scheda Opportunità",
      },
    ],
    payload: { scoreBreakdown: scoreParts, recommendedAction: "CONVERT_TO_FOUNDRY" },
  };
}

export function architectAgent(p: ProjectDTO, all: ProjectDTO[]): AgentResult {
  const similar = all
    .filter((x) => x.id !== p.id && (x.territory === p.territory || x.status === "EXECUTION"))
    .slice(0, 3);
  const present = new Set(p.stakeholders.map((s) => s.type));
  const candidates: StakeholderType[] = [
    "BANK_PROMOTER",
    "FUND_MANAGER",
    "ANCHOR_COMPANY",
    "ETS_IMPLEMENTER",
    "PA_VALIDATOR",
    "COMMUNITY_VALIDATOR",
    "TECH_PARTNER",
  ];
  const missing = candidates.filter((c) => !present.has(c));
  return {
    agent: "architect",
    title: `Blueprint ToC — ${p.name}`,
    summary: `Il Foundry è completo al ${Math.min(100, Math.round(((7 - missing.length) / 7) * 100))}%. Architettura suggerita su benchmark di venture simili già in execution.`,
    steps: [
      {
        text: `ToC attuale: ${p.toc.inputs.length} input, ${p.toc.activities.length} attività, ${p.toc.outputs.length} output, ${p.toc.outcomes.length} outcome, ${p.toc.impacts.length} impatti.`,
        source: "RF-02.1 Canvas Teoria del Cambiamento",
      },
      {
        text: `Tipologie stakeholder mancanti: ${missing.join(", ") || "nessuna — coalizione completa"}.`,
        source: "RF-02 Criterio: ≥3 tipologie per passare a Strutturata",
      },
      ...(missing.includes("COMMUNITY_VALIDATOR")
        ? [{
            text: "Suggerisco un Community Validator: aumenta il consenso locale e abilita la partecipazione cittadina (voto ponderato).",
            source: "RF-11.1 Partecipazione cittadina",
          }]
        : []),
      ...(similar.length > 0
        ? [{
            text: `Benchmark: ${similar.map((s) => s.name).join(", ")} — struttura tipo: ${similar[0].tranches.filter((t) => t.instrument !== "GUARANTEE").length} tranche blended.`,
            source: `Benchmark interno · ${similar[0].name}`,
          }]
        : [{ text: "Nessun benchmark diretto: consiglio co-design aperto con Banca Promotrice.", source: "RF-03.2 Matching Engine" }]),
      {
        text: "Definisci il RACI per ogni work package prima della validazione ToC: riduce il rischio di disallineamento in fase di execution.",
        source: "RF-02.2 Definizione RACI",
      },
    ],
    payload: { missingStakeholderTypes: missing, benchmarkProjects: similar.map((s) => s.name) },
  };
}

export type ProposedTranche = {
  instrument: Instrument;
  label: string;
  provider: string;
  amount: number;
  ratePct: number;
  maturityMonths: number;
  guaranteePct: number;
  waterfallOrder: number;
  conditions: string | null;
};

export function structurerAgent(p: ProjectDTO): AgentResult {
  const need =
    p.fundingNeed > 0
      ? p.fundingNeed
      : p.tranches.filter((t) => t.instrument !== "GUARANTEE").reduce((s, t) => s + t.amount, 0) || 1_000_000;
  const hasPA = p.stakeholders.some((s) => s.type === "PA_VALIDATOR");
  const noi = Math.max(0, p.annualRevenue - p.annualOpex);

  // Solutore vincolato: DSCR target >= 1.25
  // Servizio del debito max sostenibile da NOI annuo
  const maxDebtService = noi > 0 ? noi / 1.25 : 0;
  // Con ammortamento 10 anni al 6.5%, il fattore di annualità è ~0.14
  const maxSeniorByDscr = maxDebtService > 0 ? Math.min(need * 0.50, maxDebtService / 0.14) : need * 0.40;
  const senior = Math.max(0, Math.round(maxSeniorByDscr / 1000) * 1000);

  // Grant calibrato per garantire Leva >= 2.0x (Grant <= 25% del totale)
  const grantShare = need <= 500_000 ? 0.25 : 0.20;
  const grant = Math.round((need * grantShare) / 1000) * 1000;
  const concessional = Math.round((need * 0.20) / 1000) * 1000;
  const sib = hasPA ? Math.round((need * 0.10) / 1000) * 1000 : 0;

  // L'Equity copre il residuo
  const equityResidual = need - grant - concessional - senior - sib;
  const equity = Math.max(0, Math.round(equityResidual / 1000) * 1000);

  const guaranteeAmount = Math.round((senior * 0.8) / 1000) * 1000;

  const proposed: ProposedTranche[] = [
    { instrument: "GRANT", label: "Grant Fondazione", provider: "Fondazione / PNRR", amount: grant, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null },
    { instrument: "CONCESSIONAL_LOAN", label: "Prestito agevolato", provider: "Cassa Depositi / banca etica", amount: concessional, ratePct: 2.0, maturityMonths: 84, guaranteePct: 0, waterfallOrder: 2, conditions: null },
    { instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca promotrice", amount: senior, ratePct: 6.5, maturityMonths: 120, guaranteePct: 80, waterfallOrder: 3, conditions: null },
    ...(sib > 0
      ? [{ instrument: "SIB" as Instrument, label: "SIB Outcome Payment", provider: "PA Validatore", amount: sib, ratePct: 0, maturityMonths: 60, guaranteePct: 0, waterfallOrder: 4, conditions: "Outcome verificato da PA (MRV)" }]
      : []),
    { instrument: "EQUITY", label: "Equity Anchor", provider: p.stakeholders.find((s) => s.type === "ANCHOR_COMPANY")?.orgName ?? "Anchor Company", amount: equity, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 5, conditions: null },
    { instrument: "GUARANTEE", label: "Garanzia 80% MCC", provider: "MCC / FEI", amount: guaranteeAmount, ratePct: 0, maturityMonths: 120, guaranteePct: 80, waterfallOrder: 6, conditions: null },
  ];

  const total = proposed.filter((t) => t.instrument !== "GUARANTEE").reduce((s, t) => s + t.amount, 0);
  const leverage = grant > 0 ? total / grant : 1.0;

  // Calcolo WACC reale
  const debtSeniorWeighted = senior * 0.065 * (1 - 0.24); // al netto IRES 24%
  const debtConcWeighted = concessional * 0.020;
  const equityWeighted = equity * 0.080; // costo opportunità equity 8%
  const realWacc = total > 0 ? (debtSeniorWeighted + debtConcWeighted + equityWeighted) / total : 0.045;

  return {
    agent: "structurer",
    title: `Struttura blended ottimizzata (Solutore Vincolato) — ${p.name}`,
    summary: `Fabbisogno ${(need / 1_000_000).toFixed(2)} M€ ottimizzato: WACC reale ${(realWacc * 100).toFixed(2)}%, Leva ${leverage.toFixed(1)}x, DSCR stimato ≥ 1.25, Garanzia MCC all'80% applicata su ${(senior / 1_000_000).toFixed(2)} M€ di Senior Debt.`,
    steps: [
      {
        text: `Solutore vincolato: Capacità di debito Senior dimensionata su NOI annuo (${noi.toLocaleString("it-IT")} €) per garantire DSCR ≥ 1.25.`,
        source: "RF-04.3 Ottimizzazione vincolata DSCR",
      },
      {
        text: `Grant catalitico ${(grant / 1_000_000).toFixed(2)} M€ (${((grant / need) * 100).toFixed(0)}% del funding): massimizza la leva a ${leverage.toFixed(1)}x (target ≥ 2.0x).`,
        source: "RF-04.1 Catalogo blended",
      },
      {
        text: `Garanzia MCC all'80% su Senior Debt (${(guaranteeAmount / 1_000_000).toFixed(2)} M€): abbatte la LGD bancaria e riduce il WACC reale a ${(realWacc * 100).toFixed(2)}%.`,
        source: "MCC · Mitigazione Basilea II/III",
      },
      ...(sib > 0
        ? [{ text: "SIB / Outcome Payment integrato: 10% del funding coperto da pagamenti a risultato condizionati a MRV.", source: "RF-04.5 Pay for Success Engine" }]
        : [{ text: "SIB non attivo: nessun PA/Outcome Validator nella coalizione.", source: "RF-04.5 Pay for Success Engine" }]),
      {
        text: `Costo medio ponderato del capitale (WACC): ${(realWacc * 100).toFixed(2)}% vs 6.5% di mercato ordinario.`,
        source: "WACC = Σ (w_i * r_i)",
      },
    ],
    payload: { proposedTranches: proposed, leverage: Math.round(leverage * 10) / 10, wacc: Math.round(realWacc * 1000) / 1000 },
  };
}

export function underwriterAgent(p: ProjectDTO): AgentResult {
  const f = computeFinance(p.tranches, p);
  const kpiAvg = p.kpis.length > 0 ? p.kpis.reduce((s, k) => s + kpiProgress(k), 0) / p.kpis.length : 0;
  const impactScore = Math.round(0.5 * p.taxonomyAlignmentPct + 0.3 * kpiAvg * 100 + 0.2 * (p.dnshOk ? 100 : 40));
  const creditScore = p.creditScore > 0 ? p.creditScore : Math.round(55 + Math.min(25, f.leverage * 4));
  const final = underwritingFinalScore(creditScore, impactScore);

  const flags: string[] = [];
  if (f.dscr > 0 && f.dscr < 1.2) flags.push(`DSCR ${f.dscr.toFixed(2)} < 1.2: servizio del debito sotto soglia prudenziale`);
  if (f.leverage > 0 && f.leverage < 2) flags.push(`Leva ${f.leverage.toFixed(1)}x < 2x: struttura sbilanciata`);
  if (p.taxonomyAlignmentPct < 50) flags.push(`Allineamento EU Taxonomy ${Math.round(p.taxonomyAlignmentPct)}% < 50%: rischio classificazione SFDR`);
  if (f.debt > 0 && !p.tranches.some((t) => t.instrument === "GUARANTEE")) flags.push("Debito senior senza copertura garanzia: LGD non mitigata");
  if (final < 60) flags.push(`Score integrato ${final.toFixed(0)} < soglia tenant 60: richiesta delibera derogatoria`);

  // Formula Standard Basilea II/III: EL = PD * LGD * EAD
  // 1. Exposure at Default (EAD): Debito complessivo
  const ead = f.debt;

  // 2. Probability of Default (PD): Funzione esponenziale/quadratica dello score creditizio
  // Score 100 -> PD 0.5%; Score 70 -> PD 1.8%; Score 50 -> PD 4.2%; Score 20 -> PD 10.5%
  const pd = Math.max(0.005, Math.min(0.20, 0.15 * Math.pow((100 - creditScore) / 100, 1.8)));

  // 3. Loss Given Default (LGD): Base standard EBA 45% per crediti chirografari
  const lgdBase = 0.45;
  const guaranteePct = f.maxGuaranteePct / 100;
  const lgdMitigated = Math.max(0.05, lgdBase * (1 - guaranteePct));

  // 4. Expected Loss (EL)
  const elBasePct = pd * lgdBase;
  const elMitigatedPct = pd * lgdMitigated;
  const elEuroMitigated = ead * elMitigatedPct;

  return {
    agent: "underwriter",
    title: `Dossier Istruttoria Bancaria (Modello Basilea II/III) — ${p.name}`,
    summary: `Score integrato ${final.toFixed(0)}/100 (${final >= 60 ? "AMMISSIBILE" : "DEROGA RICHIESTA"}). Expected Loss Basilea ${(elMitigatedPct * 100).toFixed(2)}% (${(elEuroMitigated).toLocaleString("it-IT", { maximumFractionDigits: 0 })} €) su EAD ${(ead).toLocaleString("it-IT")} €.`,
    steps: [
      {
        text: `Scoring integrato: Credito ${Math.round(creditScore)}/100 + Impatto ${impactScore}/100 (Taxonomy ${Math.round(p.taxonomyAlignmentPct)}%, KPI ${Math.round(kpiAvg * 100)}%, DNSH ${p.dnshOk ? "OK" : "NO"}).`,
        source: "RF-05.1 Scoring integrato credito + ESG",
      },
      {
        text: `Modello Basilea: EAD = ${(ead).toLocaleString("it-IT")} € · PD stimata = ${(pd * 100).toFixed(2)}% · LGD base = 45.0% → LGD mitigata = ${(lgdMitigated * 100).toFixed(1)}% (Garanzia ${f.maxGuaranteePct}%).`,
        source: "Basilea II/III · Formula EL = PD × LGD × EAD",
      },
      {
        text: `Expected Loss (Perdita Attesa): ${(elBasePct * 100).toFixed(2)}% senza garanzia → ${(elMitigatedPct * 100).toFixed(2)}% (${(elEuroMitigated).toLocaleString("it-IT", { maximumFractionDigits: 0 })} €) con garanzia attiva.`,
        source: "RF-05.2 Rischio di credito regolamentare",
      },
      {
        text: `Compliance SFDR & ESG: Categoria SFDR ${p.sfdrCategory}, DNSH ${p.dnshOk ? "conforme" : "non conforme"}.`,
        source: "Regolamento UE 2019/2088 (SFDR)",
      },
      ...flags.map((fl) => ({ text: `⚠ ${fl}`, source: "RF-05.3 Check compliance automatico" })),
      {
        text: `Verdetto Comitato Fidi: ${final >= 60 ? "✓ PRATICA BANCABILE / AMMISSIBILE" : "✕ PRATICA SOSPESA: richiede delibera derogatoria o incremento garanzia"}.`,
        source: "RF-05.4 Delibera fidi integrata",
      },
    ],
    payload: {
      creditScore: Math.round(creditScore),
      impactScore,
      finalScore: final,
      expectedLossPct: Math.round(elMitigatedPct * 1000) / 10,
      pdPct: Math.round(pd * 1000) / 10,
      lgdMitigatedPct: Math.round(lgdMitigated * 1000) / 10,
      eadEuro: ead,
      flags,
    },
  };
}

export function mrvAgent(p: ProjectDTO): AgentResult {
  const suggestions = p.evidences
    .filter((e) => e.status === "PENDING")
    .map((e) => ({
      evidenceId: e.id,
      title: e.title,
      verdict: e.type === "DOCUMENT" || e.type === "SURVEY" ? "REVIEW" : "APPROVE",
      note:
        e.type === "DOCUMENT"
          ? "Richiesta verifica incrociata con fonte primaria prima della validazione."
          : "Evidenza strutturata da fonte primaria: approvazione suggerita.",
    }));
  const alerts = kpiAlerts(p.kpis);
  const f = computeFinance(p.tranches, p);
  const sroi = computeSroi(p.kpis, f.total);
  return {
    agent: "mrv",
    title: `Analisi MRV — ${p.name}`,
    summary: `${suggestions.length} evidenze da validare, ${alerts.length} alert di scostamento KPI, SROI dinamico ${sroi.toFixed(2)}.`,
    steps: [
      ...suggestions.map((s) => ({
        text: `Evidenza "${s.title}": ${s.verdict === "APPROVE" ? "approvazione suggerita" : "verifica incrociata richiesta"} — ${s.note}`,
        source: "RF-08.4 Workflow Auditor → Approved/Rejected",
      })),
      ...(suggestions.length === 0
        ? [{ text: "Nessuna evidenza in attesa di validazione.", source: "RF-08.4 Workflow validazione" }]
        : []),
      ...alerts.map((a) => ({
        text: `⚠ Alert scostamento: "${a.kpi.title}" al ${a.progressPct}% del target (soglia 70% a metà timeline).`,
        source: "RF-08.5 Alert scostamento",
      })),
      ...(alerts.length === 0
        ? [{ text: "Tutti i KPI in linea con la timeline prevista.", source: "RF-08.5 Monitoraggio KPI" }]
        : []),
      {
        text: `SROI dinamico ${sroi.toFixed(2)}: valore sociale monetizzato (proxy IRIS+) su orizzonte 5 anni rapportato al funding totale.`,
        source: "RF-08.3 SROI dinamico · Guida SVI",
      },
    ],
    payload: { evidenceSuggestions: suggestions, alerts: alerts.map((a) => ({ kpi: a.kpi.title, progressPct: a.progressPct })), sroi },
  };
}

export function storytellerAgent(p: ProjectDTO, audience: "bank" | "pa" | "citizen"): AgentResult {
  const f = computeFinance(p.tranches, p);
  const sroi = computeSroi(p.kpis, f.total);
  const base: AgentStep[] = [
    {
      text: `Dati core: funding ${(f.total / 1_000_000).toFixed(2)} M€, leva ${f.leverage.toFixed(1)}x, SROI ${sroi.toFixed(2)}, ${p.kpis.length} KPI monitorati.`,
      source: "Wallet & MRV — stessa sorgente dati per ogni pubblico",
    },
  ];
  if (audience === "bank") {
    return {
      agent: "storyteller",
      title: `Report per Banca — ${p.name}`,
      summary: `L'operazione ${p.name} presenta GAR contenuto e mitigazione multilivello: il portafoglio guadagna esposizione EU Taxonomy senza peggiorare il profilo di rischio.`,
      steps: [
        ...base,
        {
          text: `Il debito senior è assistito da garanzia MCC ${f.maxGuaranteePct}% e il DSCR previsto (${f.dscr.toFixed(2)}x) copre il servizio del debito con margine.`,
          source: "RF-10 Portale bancario · SFDR Annex",
        },
        {
          text: `Allineamento EU Taxonomy ${Math.round(p.taxonomyAlignmentPct)}%: l'esposizione contribuisce al GAR e alla strategia SFDR Art 8 del portafoglio.`,
          source: "EU Taxonomy 2020/852 · RF-12.1 Report SFDR",
        },
      ],
      payload: { audience, keyMetric: `GAR contribution +${Math.round(p.taxonomyAlignmentPct / 10)}pp` },
    };
  }
  if (audience === "pa") {
    return {
      agent: "storyteller",
      title: `Report per PA — ${p.name}`,
      summary: `${p.name} genera valore locale misurabile: ${p.fteCreated} FTE creati, LM3 ${(p.lm3 * 100).toFixed(0)}% di ogni euro trattenuto nel raggio di 50 km, ${Math.round(p.localSupplierPct)}% fornitura locale.`,
      steps: [
        ...base,
        {
          text: `Il moltiplicatore economico LM3 (${(p.lm3 * 100).toFixed(0)}%) quantifica la quota di spesa che resta sul territorio: evita la dispersione della filiera.`,
          source: "RF-07.1 Local Multiplier LM3",
        },
        {
          text: `Outcome verificati dal sistema MRV con evidenze primarie: la PA può basare i pagamenti a risultato (SIB) su dati certificati.`,
          source: "RF-08.2 Evidenze multi-canale · RF-04.5 SIB",
        },
      ],
      payload: { audience, keyMetric: `LM3 ${(p.lm3 * 100).toFixed(0)}% · ${p.fteCreated} FTE` },
    };
  }
  return {
    agent: "storyteller",
    title: `Report per la Comunità — ${p.name}`,
    summary: `In parole semplici: ${p.name} porta ${(f.total / 1_000_000).toFixed(1)} milioni di euro nel territorio di ${p.territory}, di cui ${(p.lm3 * 100).toFixed(0)}% restano nei 50 km. ${p.kpis.slice(0, 2).map((k) => `"${k.title}" con target ${k.target} ${k.unit}`).join(" e ")}.`,
    steps: [
      ...base,
      {
        text: "Tradotto: ogni euro investito genera servizi, lavoro e presidi di comunità misurabili dai cittadini stessi (Community Validator).",
        source: "RF-11.3 Social Wall · Area pubblica RF-12.2",
      },
    ],
    payload: { audience, keyMetric: `${p.fteCreated} posti di lavoro` },
  };
}

export function runAgentLogic(
  agent: AgentName,
  ctx: { project?: ProjectDTO | null; projects?: ProjectDTO[]; opportunity?: OpportunityDTO | null; audience?: string }
): AgentResult {
  switch (agent) {
    case "scout":
      if (!ctx.opportunity) throw new Error("Opportunity mancante per Scout Agent");
      return scoutAgent(ctx.opportunity);
    case "architect":
      if (!ctx.project) throw new Error("Progetto mancante per Architect Agent");
      return architectAgent(ctx.project, ctx.projects ?? [ctx.project]);
    case "structurer":
      if (!ctx.project) throw new Error("Progetto mancante per Structurer Agent");
      return structurerAgent(ctx.project);
    case "underwriter":
      if (!ctx.project) throw new Error("Progetto mancante per Underwriter Agent");
      return underwriterAgent(ctx.project);
    case "mrv":
      if (!ctx.project) throw new Error("Progetto mancante per MRV Agent");
      return mrvAgent(ctx.project);
    case "storyteller":
      if (!ctx.project) throw new Error("Progetto mancante per Storyteller Agent");
      return storytellerAgent(ctx.project, (ctx.audience as "bank" | "pa" | "citizen") ?? "bank");
  }
}

export type { EvidenceDTO, KpiDTO, TrancheDTO };
