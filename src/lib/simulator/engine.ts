export type Experience = "anfaenger" | "normal" | "experte";
export type TeamSize = "1" | "2-3" | "4+";
export type Category =
  | "saas"
  | "ecommerce"
  | "local"
  | "marketplace"
  | "consulting"
  | "app"
  | "hardware";

export interface SimulatorInputs {
  name: string;
  description: string;
  targetMarket: number; // Anzahl potenzieller Kunden
  avgPricePerCustomer: number; // € / Jahr pro Kunde
  competitionLevel: number; // Anzahl Konkurrenten
  capital: number; // €
  monthlyExpenses: number; // €
  mrrGoal: number; // €/Monat
  monthsToBreakEvenEstimate: number;
  experience: Experience;
  teamSize: TeamSize;
}

export const DEFAULT_INPUTS: SimulatorInputs = {
  name: "Meine Geschäftsidee",
  description: "",
  targetMarket: 50000,
  avgPricePerCustomer: 600,
  competitionLevel: 20,
  capital: 50000,
  monthlyExpenses: 4000,
  mrrGoal: 8000,
  monthsToBreakEvenEstimate: 12,
  experience: "normal",
  teamSize: "1",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  saas: "SaaS",
  ecommerce: "E-Commerce",
  local: "Local Business",
  marketplace: "Marketplace",
  consulting: "Consulting / Agentur",
  app: "Mobile App",
  hardware: "Hardware / Physisch",
};

// Grobe Referenzwerte (öffentliche Startup-Statistiken, gerundet)
export const CATEGORY_BENCHMARKS: Record<Category, number> = {
  saas: 15,
  ecommerce: 8,
  local: 20,
  marketplace: 5,
  consulting: 25,
  app: 4,
  hardware: 3,
};

export interface FactorBreakdown {
  label: string;
  delta: number;
}

export interface CalcResult {
  successRate: number; // 0-100, nach Monte-Carlo
  baseFactors: FactorBreakdown[];
  runwayMonths: number;
  tam: number;
  sam: number;
  som: number;
  marketSharePercent: number;
  mrrUnrealistic: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function computeFactors(inputs: SimulatorInputs): {
  factors: FactorBreakdown[];
  runwayMonths: number;
  tam: number;
  mrrUnrealistic: boolean;
} {
  const factors: FactorBreakdown[] = [];

  const runwayMonths =
    inputs.monthlyExpenses > 0 ? inputs.capital / inputs.monthlyExpenses : 999;
  if (runwayMonths > 24) factors.push({ label: "Kapital-Runway > 24 Monate", delta: 20 });
  else if (runwayMonths < 6) factors.push({ label: "Kapital-Runway < 6 Monate", delta: -15 });

  const tam = inputs.targetMarket * inputs.avgPricePerCustomer;
  if (tam > 100_000_000) factors.push({ label: "Marktgröße (TAM) > 100M €", delta: 25 });
  else if (tam < 10_000_000) factors.push({ label: "Marktgröße (TAM) < 10M €", delta: -10 });

  const competitionPenalty = -Math.min(30, Math.floor(inputs.competitionLevel / 10) * 10);
  if (competitionPenalty !== 0)
    factors.push({ label: "Konkurrenzdichte", delta: competitionPenalty });

  if (inputs.experience === "experte") factors.push({ label: "Expertenerfahrung", delta: 15 });
  else if (inputs.experience === "anfaenger")
    factors.push({ label: "Anfänger-Erfahrung", delta: -5 });

  if (inputs.teamSize !== "1") factors.push({ label: "Team ≥ 2 Personen", delta: 10 });

  const mrrUnrealistic = inputs.mrrGoal * 12 > tam * 0.05;
  if (mrrUnrealistic) factors.push({ label: "MRR-Ziel unrealistisch vs. Markt", delta: -20 });

  return { factors, runwayMonths, tam, mrrUnrealistic };
}

const BASE_SUCCESS_RATE = 10;
const MONTE_CARLO_ITERATIONS = 1000;
const VARIANCE = 0.1;

export function runMonteCarlo(factors: FactorBreakdown[]): number {
  let total = 0;
  for (let i = 0; i < MONTE_CARLO_ITERATIONS; i++) {
    let rate = BASE_SUCCESS_RATE;
    for (const f of factors) {
      const noise = 1 + (Math.random() * 2 - 1) * VARIANCE;
      rate += f.delta * noise;
    }
    total += clamp(rate, 0, 100);
  }
  return total / MONTE_CARLO_ITERATIONS;
}

export function calculate(inputs: SimulatorInputs): CalcResult {
  const { factors, runwayMonths, tam, mrrUnrealistic } = computeFactors(inputs);
  const successRate = runMonteCarlo(factors);

  const sam = tam * 0.3;
  const annualPrice = inputs.avgPricePerCustomer || 1;
  const som = sam * (inputs.mrrGoal / (annualPrice * 12) || 0);
  const marketSharePercent = tam > 0 ? ((inputs.mrrGoal * 12) / tam) * 100 : 0;

  return {
    successRate,
    baseFactors: factors,
    runwayMonths,
    tam,
    sam,
    som,
    marketSharePercent,
    mrrUnrealistic,
  };
}

export interface Scenario {
  label: string;
  successRate: number;
  monthsToBreakEven: number;
  breakEvenRevenue: number;
}

export function buildScenarios(
  inputs: SimulatorInputs,
  baseSuccessRate: number
): { best: Scenario; base: Scenario; worst: Scenario } {
  const breakEvenRevenue = inputs.monthlyExpenses;
  return {
    best: {
      label: "Best Case",
      successRate: clamp(baseSuccessRate + 30, 0, 100),
      monthsToBreakEven: Math.max(1, inputs.monthsToBreakEvenEstimate * 0.8),
      breakEvenRevenue,
    },
    base: {
      label: "Base Case",
      successRate: clamp(baseSuccessRate, 0, 100),
      monthsToBreakEven: inputs.monthsToBreakEvenEstimate,
      breakEvenRevenue,
    },
    worst: {
      label: "Worst Case",
      successRate: clamp(baseSuccessRate - 40, 0, 100),
      monthsToBreakEven: inputs.monthsToBreakEvenEstimate * 1.5,
      breakEvenRevenue,
    },
  };
}

export interface FailureFlow {
  label: string;
  percent: number;
  color: string;
}

export function buildFailureFlows(inputs: SimulatorInputs): FailureFlow[] {
  // Basiswerte aus dem Briefing, leicht gewichtet nach Inputs
  let noCustomers = 40;
  let highCosts = 25;
  let competition = 20;
  let other = 15;

  if (inputs.competitionLevel > 50) {
    competition += 10;
    noCustomers -= 5;
    other -= 5;
  }
  if (inputs.monthlyExpenses > inputs.mrrGoal) {
    highCosts += 8;
    other -= 8;
  }
  const total = noCustomers + highCosts + competition + other;
  const norm = (v: number) => Math.max(0, Math.round((v / total) * 100));

  return [
    { label: "Keine Kunden", percent: norm(noCustomers), color: "#f87171" },
    { label: "Zu hohe Kosten", percent: norm(highCosts), color: "#fb923c" },
    { label: "Konkurrenz", percent: norm(competition), color: "#facc15" },
    { label: "Anderes", percent: norm(other), color: "#94a3b8" },
  ];
}

export interface RiskPoint {
  label: string;
  probability: number; // 1-10
  impact: number; // 1-10
  color: string;
}

export function buildRiskMatrix(inputs: SimulatorInputs, runwayMonths: number): RiskPoint[] {
  const risks: RiskPoint[] = [];

  const capitalProb = runwayMonths < 12 ? 8 : runwayMonths < 24 ? 5 : 2;
  risks.push({
    label: "Zu wenig Kapital",
    probability: capitalProb,
    impact: 9,
    color: runwayMonths < 12 ? "#ef4444" : "#facc15",
  });

  const compProb = clamp(Math.round(inputs.competitionLevel / 10), 1, 10);
  risks.push({
    label: "Konkurrenzdruck",
    probability: compProb,
    impact: 6,
    color: compProb > 6 ? "#ef4444" : compProb > 3 ? "#facc15" : "#4ade80",
  });

  const marketProb = inputs.targetMarket < 10000 ? 7 : inputs.targetMarket < 100000 ? 4 : 2;
  risks.push({
    label: "Marktgröße zu klein",
    probability: marketProb,
    impact: 7,
    color: marketProb > 6 ? "#ef4444" : marketProb > 3 ? "#facc15" : "#4ade80",
  });

  const mrrRealistic = inputs.mrrGoal * 12 > inputs.targetMarket * inputs.avgPricePerCustomer * 0.05;
  risks.push({
    label: "MRR-Ziel unrealistisch",
    probability: mrrRealistic ? 7 : 2,
    impact: 5,
    color: mrrRealistic ? "#ef4444" : "#4ade80",
  });

  return risks;
}

export interface BurnPoint {
  month: number;
  capital: number;
  revenue: number;
}

export function buildBurnRate(inputs: SimulatorInputs): {
  points: BurnPoint[];
  breakEvenMonth: number | null;
} {
  const points: BurnPoint[] = [];
  let capital = inputs.capital;
  let breakEvenMonth: number | null = null;
  const rampMonths = Math.max(1, inputs.monthsToBreakEvenEstimate);

  for (let month = 0; month <= 36; month++) {
    const revenue = Math.min(inputs.mrrGoal, inputs.mrrGoal * (month / rampMonths));
    if (month > 0) {
      capital = capital - (inputs.monthlyExpenses - revenue);
    }
    points.push({ month, capital, revenue });
    if (breakEvenMonth === null && revenue >= inputs.monthlyExpenses) {
      breakEvenMonth = month;
    }
    if (capital < 0 && breakEvenMonth === null && month > 0) {
      // continue tracking but don't break early — chart needs full curve
    }
  }
  return { points, breakEvenMonth };
}
