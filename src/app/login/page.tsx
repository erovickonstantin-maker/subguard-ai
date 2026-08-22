"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoStore, type PlanKey, PLAN_LABEL } from "@/lib/demo-store";

const VALID_PLANS: PlanKey[] = ["starter", "pro", "enterprise"];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, selectPlan } = useDemoStore();
  const [email, setEmail] = useState("demo@subguard.ai");
  const [companyName, setCompanyName] = useState("Mustermann Bau GmbH");
  const [loading, setLoading] = useState(false);

  const requestedPlan = searchParams.get("plan");
  const plan = VALID_PLANS.includes(requestedPlan as PlanKey)
    ? (requestedPlan as PlanKey)
    : null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email || "demo@subguard.ai", companyName || "Mein Unternehmen");
      if (plan) selectPlan(plan);
      router.push("/dashboard");
    }, 500);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <CardTitle>Bei SubGuard AI anmelden</CardTitle>
          <CardDescription>
            Demo-Modus — keine echten Zugangsdaten nötig, einfach absenden.
          </CardDescription>
          {plan && (
            <p className="mt-2 text-xs text-muted-foreground">
              Gewählter Plan: <span className="font-medium">{PLAN_LABEL[plan]}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company">Unternehmen</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Mustermann Bau GmbH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@subguard.ai"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Anmelden…" : "Anmelden"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/" className="underline">
              Zurück zur Startseite
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
