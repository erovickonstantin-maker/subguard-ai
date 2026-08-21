import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

interface ExpiringDocumentRow {
  id: string;
  doc_type: string;
  expiration_date: string;
  subcontractors: {
    id: string;
    name: string;
    companies: {
      id: string;
      name: string;
      owner_id: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 14);

  const { data: expiringDocuments, error } = await supabase
    .from("documents")
    .select(
      `id, doc_type, expiration_date, subcontractors!inner (
        id, name, companies!inner ( id, name, owner_id )
      )`
    )
    .lte("expiration_date", cutoff.toISOString().slice(0, 10))
    .neq("status", "expired");

  if (error) {
    console.error("check-expirations query error:", error);
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }

  const rows = (expiringDocuments ?? []) as unknown as ExpiringDocumentRow[];
  let emailsSent = 0;

  for (const row of rows) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(row.subcontractors.companies.owner_id);

    if (userError || !user?.email) continue;

    await resend.emails.send({
      from: "SubGuard AI <alerts@subguard.ai>",
      to: user.email,
      subject: `Dokument läuft bald ab: ${row.subcontractors.name}`,
      html: `
        <p>Hallo,</p>
        <p>Das Dokument <strong>${row.doc_type}</strong> von
        <strong>${row.subcontractors.name}</strong> läuft am
        <strong>${row.expiration_date}</strong> ab.</p>
        <p>Bitte fordern Sie ein aktualisiertes Dokument an, um die Compliance
        aufrechtzuerhalten.</p>
        <p>— SubGuard AI</p>
      `,
    });

    emailsSent += 1;
  }

  const nowIso = new Date().toISOString().slice(0, 10);
  await supabase
    .from("documents")
    .update({ status: "expired" })
    .lt("expiration_date", nowIso)
    .neq("status", "expired");

  return NextResponse.json({ checked: rows.length, emailsSent });
}
