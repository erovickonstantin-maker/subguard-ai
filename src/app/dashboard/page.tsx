import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import type {
  DashboardKpis,
  DocumentRecord,
  SubcontractorWithDocuments,
} from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-semibold">Bitte melden Sie sich an</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sie müssen angemeldet sein, um Ihr SubGuard-AI-Dashboard zu sehen.
        </p>
        <Link href="/" className="text-sm text-primary underline">
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: subcontractorRows } = company
    ? await supabase
        .from("subcontractors")
        .select("*, documents(*)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
    : { data: [] as SubcontractorWithDocuments[] | null };

  const subcontractors = (subcontractorRows ??
    []) as SubcontractorWithDocuments[];

  const allDocuments: DocumentRecord[] = subcontractors.flatMap(
    (sub) => sub.documents ?? []
  );

  const kpis: DashboardKpis = {
    totalSubcontractors: subcontractors.length,
    activeDocuments: allDocuments.filter((doc) => doc.status === "active")
      .length,
    expiringSoonDocuments: allDocuments.filter(
      (doc) => doc.status === "expiring_soon"
    ).length,
    expiredDocuments: allDocuments.filter((doc) => doc.status === "expired")
      .length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <DashboardClient subcontractors={subcontractors} kpis={kpis} />
    </div>
  );
}
