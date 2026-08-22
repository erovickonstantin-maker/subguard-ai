"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";
import { useDemoStore } from "@/lib/demo-store";
import type { DashboardKpis, DocumentRecord } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, subcontractors, isHydrated } = useDemoStore();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  const kpis = useMemo<DashboardKpis>(() => {
    const allDocuments: DocumentRecord[] = subcontractors.flatMap(
      (sub) => sub.documents ?? []
    );
    return {
      totalSubcontractors: subcontractors.length,
      activeDocuments: allDocuments.filter((doc) => doc.status === "active")
        .length,
      expiringSoonDocuments: allDocuments.filter(
        (doc) => doc.status === "expiring_soon"
      ).length,
      expiredDocuments: allDocuments.filter((doc) => doc.status === "expired")
        .length,
    };
  }, [subcontractors]);

  if (!isHydrated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center text-muted-foreground">
        {isHydrated ? (
          <>
            <ShieldCheck className="h-8 w-8" />
            <p className="text-sm">Weiterleitung zur Anmeldung…</p>
          </>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <DashboardClient subcontractors={subcontractors} kpis={kpis} />
    </div>
  );
}
