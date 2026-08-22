"use client";

import { useMemo } from "react";
import { DashboardClient } from "@/components/DashboardClient";
import { useDemoStore } from "@/lib/demo-store";
import type { DashboardKpis, DocumentRecord } from "@/types";

export default function DashboardPage() {
  const { subcontractors } = useDemoStore();

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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DashboardClient subcontractors={subcontractors} kpis={kpis} />
    </div>
  );
}
