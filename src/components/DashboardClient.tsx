"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
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
import { UploadModal } from "@/components/UploadModal";
import { AddSubcontractorModal } from "@/components/AddSubcontractorModal";
import { StatusBadge } from "@/components/StatusBadge";
import type { DashboardKpis, SubcontractorWithDocuments } from "@/types";

interface DashboardClientProps {
  subcontractors: SubcontractorWithDocuments[];
  kpis: DashboardKpis;
}

export function DashboardClient({ subcontractors, kpis }: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
          <p className="text-sm text-muted-foreground">
            Alle Subunternehmer und deren Compliance-Status auf einen Blick.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddSubcontractorModal />
          <UploadModal
            subcontractors={subcontractors}
            onUploaded={() => router.refresh()}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subunternehmer gesamt
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalSubcontractors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Zertifikate
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Laufen bald ab
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.expiringSoonDocuments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abgelaufen
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.expiredDocuments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subunternehmer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Dokumente</TableHead>
                <TableHead>Nächstes Ablaufdatum</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcontractors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Noch keine Subunternehmer angelegt.
                  </TableCell>
                </TableRow>
              )}
              {subcontractors.map((sub) => {
                const nextExpiration = sub.documents
                  .filter((doc) => doc.expiration_date)
                  .sort(
                    (a, b) =>
                      new Date(a.expiration_date!).getTime() -
                      new Date(b.expiration_date!).getTime()
                  )[0];

                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/subcontractors/${sub.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/subcontractors/${sub.id}`}
                        className="hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {sub.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.email ?? sub.phone ?? "—"}
                    </TableCell>
                    <TableCell>{sub.documents.length}</TableCell>
                    <TableCell>
                      {nextExpiration?.expiration_date ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
