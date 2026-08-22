"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge, STATUS_LABEL } from "@/components/StatusBadge";
import { useDemoStore } from "@/lib/demo-store";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/types";

const STATUS_ORDER: DocumentStatus[] = ["active", "expiring_soon", "expired"];

const STATUS_BAR_COLOR: Record<DocumentStatus, string> = {
  active: "bg-emerald-500",
  expiring_soon: "bg-amber-500",
  expired: "bg-red-500",
  invalid: "bg-red-500",
};

const DOC_TYPE_ORDER: DocumentType[] = [
  "Haftpflichtversicherung",
  "Freistellungsbescheinigung",
  "Gewerbeanmeldung",
  "Sonstiges",
];

function daysUntil(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
}

const DOC_TYPE_BAR_COLOR = "bg-blue-500";

interface UpcomingRow {
  document: DocumentRecord;
  subcontractorName: string;
  daysRemaining: number;
}

function BarRow({
  label,
  count,
  total,
  colorClassName,
}: {
  label: string;
  count: number;
  total: number;
  colorClassName: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${colorClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { subcontractors } = useDemoStore();

  const allDocuments = useMemo<DocumentRecord[]>(
    () => subcontractors.flatMap((sub) => sub.documents ?? []),
    [subcontractors]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<DocumentStatus, number> = {
      active: 0,
      expiring_soon: 0,
      expired: 0,
      invalid: 0,
    };
    for (const doc of allDocuments) {
      counts[doc.status] += 1;
    }
    return counts;
  }, [allDocuments]);

  const totalStatusDocuments = allDocuments.length;

  const docTypeCounts = useMemo(() => {
    const counts: Record<DocumentType, number> = {
      Haftpflichtversicherung: 0,
      Freistellungsbescheinigung: 0,
      Gewerbeanmeldung: 0,
      Sonstiges: 0,
    };
    for (const doc of allDocuments) {
      counts[doc.doc_type] += 1;
    }
    return counts;
  }, [allDocuments]);

  const totalDocTypeDocuments = allDocuments.length;

  const upcomingExpirations = useMemo<UpcomingRow[]>(() => {
    const subcontractorNameById = new Map(
      subcontractors.map((sub) => [sub.id, sub.name])
    );

    return allDocuments
      .filter((doc): doc is DocumentRecord & { expiration_date: string } =>
        Boolean(doc.expiration_date)
      )
      .sort(
        (a, b) =>
          new Date(a.expiration_date).getTime() -
          new Date(b.expiration_date).getTime()
      )
      .slice(0, 10)
      .map((doc) => ({
        document: doc,
        subcontractorName:
          subcontractorNameById.get(doc.subcontractor_id) ?? "Unbekannt",
        daysRemaining: daysUntil(doc.expiration_date),
      }));
  }, [allDocuments, subcontractors]);

  const hasDocuments = allDocuments.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Berichte</h1>
        <p className="text-sm text-muted-foreground">
          Auswertungen zum Compliance-Status und den Dokumenten aller
          Subunternehmer.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance-Status-Verteilung</CardTitle>
            <CardDescription>
              Anzahl der Dokumente je Status über alle Subunternehmer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasDocuments ? (
              <div className="space-y-4">
                {STATUS_ORDER.map((status) => (
                  <BarRow
                    key={status}
                    label={STATUS_LABEL[status]}
                    count={statusCounts[status]}
                    total={totalStatusDocuments}
                    colorClassName={STATUS_BAR_COLOR[status]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumenttypen</CardTitle>
            <CardDescription>
              Verteilung der hochgeladenen Dokumente nach Typ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasDocuments ? (
              <div className="space-y-4">
                {DOC_TYPE_ORDER.map((docType) => (
                  <BarRow
                    key={docType}
                    label={docType}
                    count={docTypeCounts[docType]}
                    total={totalDocTypeDocuments}
                    colorClassName={DOC_TYPE_BAR_COLOR}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nächste Ablauftermine</CardTitle>
          <CardDescription>
            Die nächsten anstehenden Ablauftermine über alle Subunternehmer,
            sortiert nach Datum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subunternehmer</TableHead>
                <TableHead>Dokumenttyp</TableHead>
                <TableHead>Ablaufdatum</TableHead>
                <TableHead>Verbleibend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingExpirations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Keine Dokumente mit Ablaufdatum vorhanden.
                  </TableCell>
                </TableRow>
              )}
              {upcomingExpirations.map(
                ({ document, subcontractorName, daysRemaining }) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      {subcontractorName}
                    </TableCell>
                    <TableCell>{document.doc_type}</TableCell>
                    <TableCell>{document.expiration_date}</TableCell>
                    <TableCell>
                      {daysRemaining < 0 ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          Abgelaufen
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={document.status} />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p className="text-sm">
        Noch keine Dokumente vorhanden. Sobald Subunternehmer Dokumente
        hochladen, erscheinen hier Auswertungen.
      </p>
    </div>
  );
}
