import SimulatorApp from "./simulator-app";

export const metadata = {
  title: "Geschäftsideen-Erfolgs-Simulator",
  description:
    "Simuliere die Erfolgswahrscheinlichkeit deiner Geschäftsidee mit einer Monte-Carlo-Simulation, Szenarien, Risikomatrix und Benchmarks.",
};

export default function SimulatorPage() {
  return <SimulatorApp />;
}
