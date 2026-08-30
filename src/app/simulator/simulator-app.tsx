"use client";

import { useMemo, useState } from "react";
import {
  BurnPoint,
  CATEGORY_BENCHMARKS,
  CATEGORY_LABELS,
  Category,
  DEFAULT_INPUTS,
  Experience,
  SimulatorInputs,
  TeamSize,
  buildBurnRate,
  buildFailureFlows,
  buildRiskMatrix,
  buildScenarios,
  calculate,
} from "@/lib/simulator/engine";

interface SavedSimulation {
  id: string;
  name: string;
  successRate: number;
  date: string;
  inputs: SimulatorInputs;
}

const STORAGE_KEY = "biz-simulator-history";

function fmtEur(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function successColor(rate: number) {
  if (rate >= 50) return "#4ade80";
  if (rate >= 25) return "#facc15";
  return "#f87171";
}

export default function SimulatorApp() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
  const [category, setCategory] = useState<Category>("saas");
  const [history, setHistory] = useState<SavedSimulation[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [previousRate, setPreviousRate] = useState<number | null>(null);

  const result = useMemo(() => calculate(inputs), [inputs]);
  const scenarios = useMemo(
    () => buildScenarios(inputs, result.successRate),
    [inputs, result.successRate]
  );
  const flows = useMemo(() => buildFailureFlows(inputs), [inputs]);
  const risks = useMemo(
    () => buildRiskMatrix(inputs, result.runwayMonths),
    [inputs, result.runwayMonths]
  );
  const burn = useMemo(() => buildBurnRate(inputs), [inputs]);
  const benchmark = CATEGORY_BENCHMARKS[category];
  const benchmarkDiff = result.successRate - benchmark;

  function set<K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) {
    setPreviousRate(result.successRate);
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function applyScenarioButton(kind: "competition2x" | "capitalHalf" | "mrr2x" | "team2x") {
    setPreviousRate(result.successRate);
    setInputs((prev) => {
      switch (kind) {
        case "competition2x":
          return { ...prev, competitionLevel: prev.competitionLevel * 2 };
        case "capitalHalf":
          return { ...prev, capital: prev.capital / 2 };
        case "mrr2x":
          return { ...prev, mrrGoal: prev.mrrGoal * 2 };
        case "team2x":
          return {
            ...prev,
            teamSize: prev.teamSize === "1" ? "2-3" : "4+",
          };
        default:
          return prev;
      }
    });
  }

  function saveSimulation() {
    const entry: SavedSimulation = {
      id: crypto.randomUUID(),
      name: inputs.name || "Unbenannte Idee",
      successRate: result.successRate,
      date: new Date().toISOString(),
      inputs,
    };
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full/unavailable, ignore
    }
  }

  function loadSimulation(entry: SavedSimulation) {
    setPreviousRate(result.successRate);
    setInputs(entry.inputs);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <PrintStyles />
      <header className="border-b border-slate-800 bg-[#0d1526] px-6 py-5 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Geschäftsideen-Erfolgs-Simulator
            </h1>
            <p className="text-sm text-slate-400">
              Monte-Carlo-Simulation für die Erfolgswahrscheinlichkeit deiner Idee
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveSimulation}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
            >
              Idee speichern
            </button>
            <button
              onClick={exportPdf}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Bericht downloaden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
        <section className="space-y-6">
          <InputForm inputs={inputs} set={set} category={category} setCategory={setCategory} />
          <ScenarioButtons apply={applyScenarioButton} />
          {history.length > 0 && (
            <HistoryPanel history={history} onLoad={loadSimulation} />
          )}
        </section>

        <section className="space-y-6">
          <SuccessGauge rate={result.successRate} previous={previousRate} />
          <ScenarioCards scenarios={scenarios} />
          <TamSamSom result={result} inputs={inputs} />
          <BenchmarkCard category={category} benchmark={benchmark} diff={benchmarkDiff} />
          <BurnRateChart points={burn.points} breakEvenMonth={burn.breakEvenMonth} />
          <FailureSankey flows={flows} />
          <RiskMatrix risks={risks} />
        </section>
      </main>
    </div>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: white !important;
          color: black !important;
        }
        .print\\:hidden {
          display: none !important;
        }
      }
    `}</style>
  );
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
    />
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = fmtNum,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (n: number) => string;
}) {
  const [prevVal, setPrevVal] = useState(value);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-slate-300">
          {dragging && prevVal !== value ? (
            <>
              <span className="text-slate-500">{format(prevVal)}</span>
              <span className="mx-1">→</span>
              <span className="font-semibold text-emerald-400">{format(value)}</span>
            </>
          ) : (
            <span className="font-semibold text-slate-200">{format(value)}</span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onMouseDown={() => setPrevVal(value)}
        onTouchStart={() => setPrevVal(value)}
        onFocus={() => setPrevVal(value)}
        onChange={(e) => {
          setDragging(true);
          onChange(Number(e.target.value));
        }}
        onMouseUp={() => setDragging(false)}
        onTouchEnd={() => setDragging(false)}
        onBlur={() => setDragging(false)}
        className="w-full accent-emerald-500"
      />
    </div>
  );
}

function InputForm({
  inputs,
  set,
  category,
  setCategory,
}: {
  inputs: SimulatorInputs;
  set: <K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) => void;
  category: Category;
  setCategory: (c: Category) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Geschäftsidee
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldShell label="Idee-Name">
          <TextInput value={inputs.name} onChange={(v) => set("name", v)} />
        </FieldShell>
        <FieldShell label="Kategorie">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div className="mt-4">
        <FieldShell label="Beschreibung">
          <textarea
            value={inputs.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          />
        </FieldShell>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SliderField
          label="Zielmarkt (potenzielle Kunden)"
          value={inputs.targetMarket}
          min={100}
          max={5_000_000}
          step={100}
          onChange={(v) => set("targetMarket", v)}
        />
        <SliderField
          label="Ø Preis pro Kunde (€/Jahr)"
          value={inputs.avgPricePerCustomer}
          min={10}
          max={20000}
          step={10}
          onChange={(v) => set("avgPricePerCustomer", v)}
          format={fmtEur}
        />
        <SliderField
          label="Konkurrenz-Level (Anzahl Konkurrenten)"
          value={inputs.competitionLevel}
          min={0}
          max={500}
          onChange={(v) => set("competitionLevel", v)}
        />
        <SliderField
          label="Kapital (€)"
          value={inputs.capital}
          min={0}
          max={2_000_000}
          step={500}
          onChange={(v) => set("capital", v)}
          format={fmtEur}
        />
        <SliderField
          label="Monatliche Ausgaben (€)"
          value={inputs.monthlyExpenses}
          min={100}
          max={200_000}
          step={100}
          onChange={(v) => set("monthlyExpenses", v)}
          format={fmtEur}
        />
        <SliderField
          label="MRR-Ziel (€/Monat)"
          value={inputs.mrrGoal}
          min={0}
          max={500_000}
          step={100}
          onChange={(v) => set("mrrGoal", v)}
          format={fmtEur}
        />
        <SliderField
          label="Monate bis Break-Even (Schätzung)"
          value={inputs.monthsToBreakEvenEstimate}
          min={1}
          max={60}
          onChange={(v) => set("monthsToBreakEvenEstimate", v)}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldShell label="Deine Erfahrung">
          <select
            value={inputs.experience}
            onChange={(e) => set("experience", e.target.value as Experience)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          >
            <option value="anfaenger">Anfänger</option>
            <option value="normal">Normal</option>
            <option value="experte">Expert</option>
          </select>
        </FieldShell>
        <FieldShell label="Team-Größe">
          <select
            value={inputs.teamSize}
            onChange={(e) => set("teamSize", e.target.value as TeamSize)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          >
            <option value="1">1</option>
            <option value="2-3">2-3</option>
            <option value="4+">4+</option>
          </select>
        </FieldShell>
      </div>
    </div>
  );
}

function ScenarioButtons({
  apply,
}: {
  apply: (kind: "competition2x" | "capitalHalf" | "mrr2x" | "team2x") => void;
}) {
  const buttons: { key: "competition2x" | "capitalHalf" | "mrr2x" | "team2x"; label: string }[] = [
    { key: "competition2x", label: "Konkurrenz verdoppelt sich" },
    { key: "capitalHalf", label: "Kapital halbiert sich" },
    { key: "mrr2x", label: "MRR 2x höher" },
    { key: "team2x", label: "Team verdoppelt sich" },
  ];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Was-wäre-wenn
      </h2>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.key}
            onClick={() => apply(b.key)}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({
  history,
  onLoad,
}: {
  history: SavedSimulation[];
  onLoad: (entry: SavedSimulation) => void;
}) {
  const maxRate = Math.max(...history.map((h) => h.successRate), 1);
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5 print:hidden">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Gespeicherte Ideen
      </h2>
      <div className="mb-4 flex h-24 items-end gap-1">
        {[...history]
          .slice()
          .reverse()
          .map((h) => (
            <div
              key={h.id}
              title={`${h.name}: ${h.successRate.toFixed(1)}%`}
              onClick={() => onLoad(h)}
              className="flex-1 cursor-pointer rounded-t bg-emerald-600/60 transition hover:bg-emerald-500"
              style={{ height: `${(h.successRate / maxRate) * 100}%` }}
            />
          ))}
      </div>
      <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
        {history.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => onLoad(h)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-slate-800"
            >
              <span className="truncate text-slate-200">{h.name}</span>
              <span className="ml-3 shrink-0 text-xs text-slate-400">
                {h.successRate.toFixed(0)}% · {new Date(h.date).toLocaleDateString("de-DE")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuccessGauge({ rate, previous }: { rate: number; previous: number | null }) {
  const color = successColor(rate);
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Erfolgswahrscheinlichkeit
      </p>
      <div className="mt-2 flex items-end justify-center gap-2">
        <span className="text-6xl font-bold tabular-nums transition-colors" style={{ color }}>
          {rate.toFixed(1)}%
        </span>
        {previous !== null && Math.abs(previous - rate) > 0.05 && (
          <span className="mb-2 text-sm text-slate-500">
            (vorher {previous.toFixed(1)}%)
          </span>
        )}
      </div>
      <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Monte-Carlo-Simulation, 1000 Iterationen, ±10% Varianz pro Faktor
      </p>
    </div>
  );
}

function ScenarioCards({
  scenarios,
}: {
  scenarios: ReturnType<typeof buildScenarios>;
}) {
  const items = [scenarios.best, scenarios.base, scenarios.worst];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {s.label}
          </p>
          <p
            className="mt-2 text-2xl font-bold"
            style={{ color: successColor(s.successRate) }}
          >
            {s.successRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {s.monthsToBreakEven.toFixed(1)} Monate bis Break-Even
          </p>
          <p className="text-xs text-slate-500">
            Break-Even-Umsatz: {fmtEur(s.breakEvenRevenue)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TamSamSom({
  result,
  inputs,
}: {
  result: ReturnType<typeof calculate>;
  inputs: SimulatorInputs;
}) {
  const shareOk = result.marketSharePercent < 10;
  const shareBad = result.marketSharePercent > 50;
  const shareColor = shareBad ? "#f87171" : shareOk ? "#4ade80" : "#facc15";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        TAM / SAM / SOM
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-400">TAM</p>
          <p className="text-lg font-semibold text-slate-100">{fmtEur(result.tam)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-400">SAM (30%)</p>
          <p className="text-lg font-semibold text-slate-100">{fmtEur(result.sam)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-center">
          <p className="text-xs text-slate-400">SOM</p>
          <p className="text-lg font-semibold text-slate-100">{fmtEur(result.som)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm" style={{ color: shareColor }}>
        Du willst {result.marketSharePercent.toFixed(1)}% des Marktes (MRR-Ziel × 12 ÷ TAM). Das
        ist {shareBad ? "unrealistisch hoch" : shareOk ? "realistisch" : "ambitioniert"}.
      </p>
      {result.mrrUnrealistic && (
        <p className="mt-1 text-xs text-red-400">
          Hinweis: MRR-Ziel ({fmtEur(inputs.mrrGoal)}/Monat) übersteigt 5% des jährlichen
          Marktpotenzials — Erfolgsquote wird dadurch mit -20% belastet.
        </p>
      )}
    </div>
  );
}

function BenchmarkCard({
  category,
  benchmark,
  diff,
}: {
  category: Category;
  benchmark: number;
  diff: number;
}) {
  const above = diff >= 0;
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Benchmark-Vergleich
      </h2>
      <p className="text-sm text-slate-300">
        Durchschnittliche Erfolgsquote für{" "}
        <span className="font-medium text-slate-100">{CATEGORY_LABELS[category]}</span>:{" "}
        <span className="font-semibold">{benchmark}%</span>
      </p>
      <p
        className={`mt-1 text-sm font-medium ${above ? "text-emerald-400" : "text-red-400"}`}
      >
        Du liegst {Math.abs(diff).toFixed(1)} Prozentpunkte {above ? "über" : "unter"} dem
        Durchschnitt.
      </p>
    </div>
  );
}

function BurnRateChart({
  points,
  breakEvenMonth,
}: {
  points: BurnPoint[];
  breakEvenMonth: number | null;
}) {
  const width = 560;
  const height = 200;
  const padding = 30;
  const maxCapital = Math.max(...points.map((p) => p.capital), 1);
  const minCapital = Math.min(...points.map((p) => p.capital), 0);
  const range = maxCapital - minCapital || 1;
  const xStep = (width - padding * 2) / (points.length - 1);

  const toX = (i: number) => padding + i * xStep;
  const toY = (v: number) =>
    height - padding - ((v - minCapital) / range) * (height - padding * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.capital)}`)
    .join(" ");
  const zeroY = toY(0);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Burn-Rate & Runway
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        {breakEvenMonth !== null
          ? `Break-Even voraussichtlich in Monat ${breakEvenMonth}`
          : "Break-Even wird innerhalb von 36 Monaten nicht erreicht"}
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line
          x1={padding}
          y1={zeroY}
          x2={width - padding}
          y2={zeroY}
          stroke="#334155"
          strokeDasharray="4 4"
        />
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth={2} />
        {breakEvenMonth !== null && (
          <circle
            cx={toX(breakEvenMonth)}
            cy={toY(points[breakEvenMonth].capital)}
            r={5}
            fill="#4ade80"
          />
        )}
        {breakEvenMonth === null && (
          <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].capital)} r={5} fill="#f87171" />
        )}
        <text x={padding} y={height - 6} fill="#64748b" fontSize={10}>
          Monat 0
        </text>
        <text x={width - padding - 40} y={height - 6} fill="#64748b" fontSize={10}>
          Monat {points.length - 1}
        </text>
      </svg>
    </div>
  );
}

function FailureSankey({ flows }: { flows: ReturnType<typeof buildFailureFlows> }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Wo scheitert es wahrscheinlich?
      </h2>
      <div className="space-y-2">
        {flows.map((f) => (
          <div key={f.label}>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>Kapital → Monate → {f.label}</span>
              <span className="font-semibold">{f.percent}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${f.percent}%`, backgroundColor: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskMatrix({ risks }: { risks: ReturnType<typeof buildRiskMatrix> }) {
  const size = 10;
  const cell = 26;
  const width = size * cell + 40;
  const height = size * cell + 40;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Risiko-Matrix
      </h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md">
        {Array.from({ length: size }).map((_, row) =>
          Array.from({ length: size }).map((_, col) => {
            const p = col + 1;
            const i = size - row;
            const severity = p * i;
            const bg =
              severity > 60 ? "#7f1d1d" : severity > 30 ? "#78350f" : "#14532d";
            return (
              <rect
                key={`${row}-${col}`}
                x={30 + col * cell}
                y={10 + row * cell}
                width={cell - 2}
                height={cell - 2}
                fill={bg}
                opacity={0.5}
              />
            );
          })
        )}
        <text x={2} y={10 + (size / 2) * cell} fill="#94a3b8" fontSize={9}>
          Impact
        </text>
        <text x={30 + (size / 2) * cell - 30} y={height - 2} fill="#94a3b8" fontSize={9}>
          Wahrscheinlichkeit
        </text>
        {risks.map((r) => {
          const cx = 30 + (r.probability - 1) * cell + cell / 2;
          const cy = 10 + (size - r.impact) * cell + cell / 2;
          return (
            <g key={r.label}>
              <circle cx={cx} cy={cy} r={7} fill={r.color} stroke="#0b1120" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {risks.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
            {r.label} — Wahrscheinlichkeit {r.probability}/10, Auswirkung {r.impact}/10
          </li>
        ))}
      </ul>
    </div>
  );
}
