"use client";

import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useDemoStore, PLAN_LABEL, PLAN_PRICE, type PlanKey } from "@/lib/demo-store";

const PLAN_ORDER: PlanKey[] = ["starter", "pro", "enterprise"];

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  starter: [
    "Bis zu 15 Subunternehmer",
    "KI-Dokumentenanalyse",
    "E-Mail-Warnungen",
    "1 Nutzerkonto",
  ],
  pro: [
    "Unbegrenzte Subunternehmer",
    "E-Mail- & SMS-Warnungen",
    "Bis zu 5 Nutzerkonten",
    "Priorisierter Support",
  ],
  enterprise: [
    "Unbegrenzte Subunternehmer & Nutzer",
    "API-Zugriff",
    "Dedizierter Ansprechpartner",
  ],
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  paid: "Bezahlt",
  open: "Offen",
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  open: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

export default function BillingPage() {
  const { user, invoices, selectPlan } = useDemoStore();

  if (!user) {
    return null;
  }

  const currentPlan = user.plan;

  const handleSelectPlan = (plan: PlanKey) => {
    selectPlan(plan);
    toast.add({
      title: "Plan gewechselt",
      description: `Sie nutzen jetzt den ${PLAN_LABEL[plan]}-Plan.`,
      type: "success",
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abrechnung</h1>
        <p className="text-sm text-muted-foreground">
          Verwalten Sie Ihren Plan und sehen Sie sich vergangene Rechnungen an.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktueller Plan</CardTitle>
          <CardDescription>Details zu Ihrem laufenden Abonnement.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="text-2xl font-bold">{PLAN_LABEL[currentPlan]}</span>
            <span className="text-muted-foreground">
              ${PLAN_PRICE[currentPlan]} / Monat
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Monatlich kündbar.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Plan wechseln</h2>
          <p className="text-sm text-muted-foreground">
            Wählen Sie den Plan, der am besten zu Ihrem Unternehmen passt.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const isActive = plan === currentPlan;
            return (
              <Card
                key={plan}
                className={isActive ? "border-primary ring-1 ring-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{PLAN_LABEL[plan]}</CardTitle>
                    {isActive && <Badge>Aktueller Plan</Badge>}
                  </div>
                  <CardDescription>
                    ${PLAN_PRICE[plan]} / Monat
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="space-y-2 text-sm">
                    {PLAN_FEATURES[plan].map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!isActive && (
                    <Button
                      variant="outline"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      Zu {PLAN_LABEL[plan]} wechseln
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechnungen</CardTitle>
          <CardDescription>Ihre bisherigen Zahlungen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Noch keine Rechnungen vorhanden.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell>{PLAN_LABEL[invoice.plan]}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>
                    <Badge className={INVOICE_STATUS_STYLE[invoice.status] ?? ""}>
                      {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
