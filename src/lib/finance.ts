import type { Instrument } from "@/db/schema";
import type { KpiDTO, ProjectDTO, TrancheDTO } from "@/lib/types";

/** RF-04: Catalogo strumenti di finanza blended con costo del capitale convenzionale. */
export const INSTRUMENT_META: Record<
  Instrument,
  { label: string; short: string; badge: string; bar: string; cost: number; desc: string }
> = {
  GRANT: {
    label: "Grant",
    short: "Grant",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
    cost: 0,
    desc: "Fondo perduto (Fondazione / PNRR / FEI)",
  },
  CONCESSIONAL_LOAN: {
    label: "Prestito agevolato",
    short: "Agevolato",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    bar: "bg-teal-500",
    cost: 0.02,
    desc: "Debito a tasso inferiore al mercato",
  },
  SENIOR_DEBT: {
    label: "Debito senior",
    short: "Senior",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    bar: "bg-sky-500",
    cost: 0.065,
    desc: "Finanziamento bancario ordinario",
  },
  GUARANTEE: {
    label: "Garanzia",
    short: "Garanzia",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
    bar: "bg-violet-500",
    cost: 0.012,
    desc: "Garanzia MCC / FEI / SACE (fino 80%)",
  },
  EQUITY: {
    label: "Equity",
    short: "Equity",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
    cost: 0.12,
    desc: "Capitale di rischio (fondo / anchor)",
  },
  SIB: {
    label: "SIB / Outcome Payment",
    short: "SIB",
    badge: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    bar: "bg-fuchsia-500",
    cost: 0.15,
    desc: "Pagamento a risultato dalla PA",
  },
  REVENUE_SHARE: {
    label: "Revenue Share",
    short: "RevShare",
    badge: "bg-lime-100 text-lime-800 border-lime-200",
    bar: "bg-lime-500",
    cost: 0.05,
    desc: "Condivisione ricavi con investitore",
  },
  COMMUNITY_SHARES: {
    label: "Community Shares",
    short: "ComShares",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    bar: "bg-orange-500",
    cost: 0.04,
    desc: "Quote sottoscritte dai cittadini",
  },
};

export type FinanceComputed = {
  total: number;
  grant: number;
  debt: number;
  equity: number;
  guarantee: number;
  leverage: number;
  wacc: number;
  debtService: number;
  noi: number;
  dscr: number;
  amortization: { label: string; year: number; payment: number }[];
  maxGuaranteePct: number;
};

export function annuity(P: number, ratePct: number, years: number): number {
  if (years <= 0) return 0;
  const r = ratePct / 100;
  if (r <= 0) return P / years;
  return (P * r * Math.pow(1 + r, years)) / (Math.pow(1 + r, years) - 1);
}

/** RF-04.3: simulatore — leva, WACC blended, DSCR, piano ammortamento per tranche. */
export function computeFinance(
  tranches: TrancheDTO[],
  p: { fundingNeed: number; annualRevenue: number; annualOpex: number }
): FinanceComputed {
  const funding = tranches.filter((t) => t.instrument !== "GUARANTEE");
  const guarantees = tranches.filter((t) => t.instrument === "GUARANTEE");

  const total = funding.reduce((s, t) => s + t.amount, 0);
  const grant = funding
    .filter((t) => t.instrument === "GRANT")
    .reduce((s, t) => s + t.amount, 0);
  const debt = funding
    .filter((t) => t.instrument === "CONCESSIONAL_LOAN" || t.instrument === "SENIOR_DEBT")
    .reduce((s, t) => s + t.amount, 0);
  const equity = funding
    .filter(
      (t) =>
        t.instrument === "EQUITY" ||
        t.instrument === "SIB" ||
        t.instrument === "REVENUE_SHARE" ||
        t.instrument === "COMMUNITY_SHARES"
    )
    .reduce((s, t) => s + t.amount, 0);
  const guarantee = guarantees.reduce((s, t) => s + t.amount, 0);

  const leverage = grant > 0 ? total / grant : 0;

  const waccCost = funding.reduce(
    (s, t) => s + t.amount * INSTRUMENT_META[t.instrument].cost,
    0
  );
  const wacc = total > 0 ? waccCost / total : 0;

  const debtTranches = funding.filter(
    (t) => t.instrument === "CONCESSIONAL_LOAN" || t.instrument === "SENIOR_DEBT"
  );
  const debtService = debtTranches.reduce(
    (s, t) => s + annuity(t.amount, t.ratePct, Math.max(1, Math.round(t.maturityMonths / 12))),
    0
  );

  const noi = p.annualRevenue - p.annualOpex;
  const dscr = debtService > 0 ? noi / debtService : 0;

  const amortization: { label: string; year: number; payment: number }[] = [];
  for (const t of debtTranches) {
    const years = Math.max(1, Math.round(t.maturityMonths / 12));
    for (let y = 1; y <= Math.min(years, 10); y++) {
      amortization.push({
        label: t.label,
        year: y,
        payment: annuity(t.amount, t.ratePct, years),
      });
    }
  }

  return {
    total,
    grant,
    debt,
    equity,
    guarantee,
    leverage,
    wacc,
    debtService,
    noi,
    dscr,
    amortization,
    maxGuaranteePct: guarantees.reduce((m, t) => Math.max(m, t.guaranteePct), 0),
  };
}

/** RF-05.1: score integrato = 55% credito + 45% impatto. */
export function underwritingFinalScore(creditScore: number, impactScore: number): number {
  return Math.round((0.55 * creditScore + 0.45 * impactScore) * 10) / 10;
}

export function kpiProgress(k: KpiDTO): number {
  if (k.target <= 0) return 0;
  return Math.min(1, Math.max(0, k.current / k.target));
}

/** RF-08.3: SROI dinamico — valore sociale monetizzato (proxy) su orizzonte 5 anni vs funding. */
export function computeSroi(kpis: KpiDTO[], totalFunding: number): number {
  const yearly = kpis.reduce((s, k) => s + k.current * k.valuePerUnit, 0);
  const social5y = yearly * 5;
  if (totalFunding <= 0) return 0;
  return Math.round(((social5y - totalFunding) / totalFunding) * 100) / 100;
}

export function sroiSocialValue(kpis: KpiDTO[]): number {
  return kpis.reduce((s, k) => s + k.current * k.valuePerUnit, 0) * 5;
}

/** RF-08.5: alert scostamento KPI. */
export function kpiAlerts(kpis: KpiDTO[]): { kpi: KpiDTO; progressPct: number }[] {
  return kpis
    .filter((k) => k.target > 0 && kpiProgress(k) < 0.7)
    .map((k) => ({ kpi: k, progressPct: Math.round(kpiProgress(k) * 100) }));
}

/** Proiezione break-even (RF-07.4): con e senza grant. */
export function breakEvenYears(p: ProjectDTO): { withGrant: number | null; withoutGrant: number | null } {
  const noi = p.annualRevenue - p.annualOpex;
  const f = computeFinance(p.tranches, p);
  if (noi <= 0) return { withGrant: null, withoutGrant: null };
  const withGrant = f.total - f.grant > 0 ? (f.total - f.grant) / noi : 0;
  const withoutGrant = f.total > 0 ? f.total / noi : 0;
  return { withGrant, withoutGrant };
}

export type OutcomeValuationInput = {
  years: number;
  publicSavingsYearly: number;
  fiscalRevenuesYearly: number;
  privateBenefitsYearly: number;
  decayRatePct: number;
};

export type OutcomeValuationResult = {
  grossValue: number;
  netValue: number;
  bcr: number;
  yearlyTotal: number;
  publicSavingsTotal: number;
  fiscalRevenuesTotal: number;
  privateBenefitsTotal: number;
};

/** Calcola il Valore Netto dell'Outcome (unitario) basato sui parametri controfattuali. */
export function calculateOutcomeValuation(
  input: OutcomeValuationInput,
  unitCost: number
): OutcomeValuationResult {
  const { years, publicSavingsYearly, fiscalRevenuesYearly, privateBenefitsYearly, decayRatePct } = input;
  const yearlyTotal = (publicSavingsYearly || 0) + (fiscalRevenuesYearly || 0) + (privateBenefitsYearly || 0);
  const rate = (decayRatePct || 0) / 100;
  let grossValue = 0;
  const numYears = Math.max(1, years || 5);
  for (let t = 1; t <= numYears; t++) {
    grossValue += yearlyTotal / Math.pow(1 + rate, t - 1);
  }
  grossValue = Math.round(grossValue);
  const netValue = grossValue - (unitCost || 0);
  const bcr = unitCost > 0 ? Math.round((grossValue / unitCost) * 10) / 10 : 0;
  return {
    grossValue,
    netValue,
    bcr,
    yearlyTotal,
    publicSavingsTotal: Math.round((publicSavingsYearly || 0) * numYears),
    fiscalRevenuesTotal: Math.round((fiscalRevenuesYearly || 0) * numYears),
    privateBenefitsTotal: Math.round((privateBenefitsYearly || 0) * numYears),
  };
}

export type PayForSuccessComputed = {
  hasPfs: boolean;
  outcomeTranches: TrancheDTO[];
  maxOutcomeBudget: number;
  payerName: string;
  linkedKpi: KpiDTO | null;
  targetUnits: number;
  currentUnits: number;
  unitTariff: number;
  costPerOutcome: number;
  socialValuePerUnit: number;
  netUnitOutcomeValue: number;
  bcr: number;
  conditionMet: boolean;
  unlockedPayment: number;
  progressPct: number;
};

/** Analisi e calcolo contratti Pay for Success (PFS) / SIB / Pagamenti a Risultato. */
export function computePayForSuccess(p: ProjectDTO): PayForSuccessComputed {
  const outcomeTranches = p.tranches.filter(
    (t) => t.instrument === "SIB" || (t.conditions && t.conditions.includes("kpi:"))
  );
  const hasPfs = outcomeTranches.length > 0;

  if (!hasPfs) {
    return {
      hasPfs: false,
      outcomeTranches: [],
      maxOutcomeBudget: 0,
      payerName: "N/D",
      linkedKpi: null,
      targetUnits: 0,
      currentUnits: 0,
      unitTariff: 0,
      costPerOutcome: 0,
      socialValuePerUnit: 0,
      netUnitOutcomeValue: 0,
      bcr: 0,
      conditionMet: false,
      unlockedPayment: 0,
      progressPct: 0,
    };
  }

  const primaryTranche = outcomeTranches[0];
  const maxOutcomeBudget = outcomeTranches.reduce((s, t) => s + t.amount, 0);
  const payerName = primaryTranche.provider || "Outcome Payer (PA / Fondazione / Privato)";

  // Identificazione KPI collegato dalla condizione (es. "kpi:9 >= 60")
  let targetUnits = 0;
  let linkedKpi: KpiDTO | null = null;

  if (primaryTranche.conditions) {
    const m = primaryTranche.conditions.match(/kpi:(\d+)\s*>=\s*([\d.]+)/);
    if (m) {
      const kpiId = Number(m[1]);
      targetUnits = Number(m[2]);
      linkedKpi = p.kpis.find((k) => k.id === kpiId) ?? null;
    }
  }

  if (!linkedKpi && p.kpis.length > 0) {
    linkedKpi = p.kpis[0];
    if (targetUnits <= 0) targetUnits = linkedKpi.target || 1;
  }

  const currentUnits = linkedKpi?.current ?? 0;
  if (targetUnits <= 0) targetUnits = linkedKpi?.target || 1;

  // Costo unitario con cui l'Attuatore si impegna a realizzare l'outcome (Plafond ÷ Target)
  const costPerOutcome = Math.round(maxOutcomeBudget / Math.max(1, targetUnits));
  const unitTariff = costPerOutcome;

  // Valore economico sociale unitario (proxy scientifico/amministrativo da KPI.valuePerUnit)
  const socialValuePerUnit = linkedKpi?.valuePerUnit || (costPerOutcome * 3);

  // Valore Netto dell'Outcome (Unitario) = Valore Lordo - Costo Unitario
  const netUnitOutcomeValue = socialValuePerUnit - costPerOutcome;

  // Benefit-Cost Ratio (BCR)
  const bcr = costPerOutcome > 0 ? Math.round((socialValuePerUnit / costPerOutcome) * 10) / 10 : 0;

  const conditionMet = currentUnits >= targetUnits;
  const unlockedPayment = Math.min(maxOutcomeBudget, Math.round(currentUnits * unitTariff));
  const progressPct = Math.min(100, Math.round((currentUnits / Math.max(1, targetUnits)) * 100));

  return {
    hasPfs: true,
    outcomeTranches,
    maxOutcomeBudget,
    payerName,
    linkedKpi,
    targetUnits,
    currentUnits,
    unitTariff,
    costPerOutcome,
    socialValuePerUnit,
    netUnitOutcomeValue,
    bcr,
    conditionMet,
    unlockedPayment,
    progressPct,
  };
}

