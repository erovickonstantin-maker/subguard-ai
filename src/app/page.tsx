import Link from "next/link";
import {
  ShieldCheck,
  FileScan,
  BellRing,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: FileScan,
    title: "KI-Dokumentenanalyse",
    description:
      "Laden Sie Versicherungsnachweise, Freistellungsbescheinigungen und Gewerbeanmeldungen hoch — unsere KI extrahiert alle relevanten Daten in Sekunden.",
  },
  {
    icon: BellRing,
    title: "Automatische Warnungen",
    description:
      "Erhalten Sie E-Mail-Benachrichtigungen, bevor Zertifikate Ihrer Subunternehmer ablaufen — nie wieder Compliance-Lücken.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance auf einen Blick",
    description:
      "Ein zentrales Dashboard zeigt den Status aller Subunternehmer: aktiv, läuft bald ab oder abgelaufen.",
  },
  {
    icon: BarChart3,
    title: "Nachvollziehbare Historie",
    description:
      "Jedes Dokument, jede Analyse und jede Änderung wird lückenlos protokolliert — ideal für Audits und Nachweise.",
  },
];

const FAQ = [
  {
    question: "Welche Dokumente kann SubGuard AI analysieren?",
    answer:
      "Haftpflichtversicherungsnachweise, Freistellungsbescheinigungen, Gewerbeanmeldungen und weitere PDF- oder Bilddokumente Ihrer Subunternehmer.",
  },
  {
    question: "Wie genau ist die KI-Extraktion?",
    answer:
      "Wir nutzen Claude von Anthropic für die Dokumentenanalyse. Alle extrahierten Daten werden übersichtlich dargestellt, sodass Sie sie vor der Übernahme prüfen können.",
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Ja, beide Pläne sind monatlich kündbar. Es gibt keine Mindestvertragslaufzeit.",
  },
  {
    question: "Ist meine Daten sicher?",
    answer:
      "Alle Daten werden verschlüsselt in Supabase gespeichert, mit Row-Level-Security, sodass nur Sie Zugriff auf Ihre Unternehmensdaten haben.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>SubGuard AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Funktionen
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Preise
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <Button render={<Link href="/dashboard" />}>
            Dashboard öffnen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Für Bauunternehmen &amp; Handwerksbetriebe
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Compliance-Überwachung für Subunternehmer, automatisiert per KI
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          SubGuard AI liest Zertifikate Ihrer Subunternehmer automatisch aus,
          überwacht Ablaufdaten und warnt Sie rechtzeitig — bevor es teuer wird.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" render={<Link href="/dashboard" />}>
            Jetzt kostenlos starten
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" render={<a href="#features" />}>
            Mehr erfahren
          </Button>
        </div>

        <Card className="mx-auto mt-16 max-w-4xl text-left">
          <CardHeader>
            <CardTitle>Live-Vorschau: Subunternehmer-Übersicht</CardTitle>
            <CardDescription>
              So sieht Ihr Dashboard nach der Einrichtung aus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">
                      Subunternehmer
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Dokument
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Läuft ab
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3">Müller Elektro GmbH</td>
                    <td className="px-4 py-3">Haftpflichtversicherung</td>
                    <td className="px-4 py-3">15.09.2026</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Aktiv
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Bau-Team Schulz</td>
                    <td className="px-4 py-3">Freistellungsbescheinigung</td>
                    <td className="px-4 py-3">02.09.2026</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Läuft bald ab
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Dach &amp; Fassade Kowalski</td>
                    <td className="px-4 py-3">Gewerbeanmeldung</td>
                    <td className="px-4 py-3">30.06.2026</td>
                    <td className="px-4 py-3">
                      <Badge variant="destructive">Abgelaufen</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Alles, was Sie für Subunternehmer-Compliance brauchen
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-2 text-lg">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Einfache, transparente Preise
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Monatlich kündbar. Keine versteckten Kosten.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>
                  Für kleine Betriebe mit bis zu 15 Subunternehmern.
                </CardDescription>
                <div className="mt-4 text-4xl font-bold">
                  $49
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / Monat
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Bis zu 15 Subunternehmer",
                  "KI-Dokumentenanalyse",
                  "E-Mail-Warnungen",
                  "1 Nutzerkonto",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  render={<Link href="/dashboard" />}
                >
                  Starter wählen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Beliebt</Badge>
                </div>
                <CardDescription>
                  Für wachsende Bauunternehmen mit unbegrenzten Subunternehmern.
                </CardDescription>
                <div className="mt-4 text-4xl font-bold">
                  $149
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / Monat
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Unbegrenzte Subunternehmer",
                  "KI-Dokumentenanalyse",
                  "E-Mail- & SMS-Warnungen",
                  "Bis zu 5 Nutzerkonten",
                  "Priorisierter Support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
                <Button className="mt-4 w-full" render={<Link href="/dashboard" />}>
                  Pro wählen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Häufig gestellte Fragen
          </h2>
          <div className="mt-10 space-y-6">
            {FAQ.map((item) => (
              <div key={item.question}>
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>© 2026 SubGuard AI. Alle Rechte vorbehalten.</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            SubGuard AI
          </div>
        </div>
      </footer>
    </div>
  );
}
