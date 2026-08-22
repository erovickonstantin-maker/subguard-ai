"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadModal } from "@/components/UploadModal";
import { toast } from "@/components/ui/toast";
import { useDemoStore } from "@/lib/demo-store";

export default function SubcontractorDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { subcontractors, updateSubcontractor, deleteSubcontractor, deleteDocument } =
    useDemoStore();

  const subcontractor = subcontractors.find((s) => s.id === id);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(subcontractor?.name ?? "");
  const [email, setEmail] = useState(subcontractor?.email ?? "");
  const [phone, setPhone] = useState(subcontractor?.phone ?? "");

  function handleEditOpenChange(open: boolean) {
    if (open && subcontractor) {
      setName(subcontractor.name);
      setEmail(subcontractor.email ?? "");
      setPhone(subcontractor.phone ?? "");
    }
    setEditOpen(open);
  }

  function handleSaveEdit() {
    if (!subcontractor) return;
    updateSubcontractor(subcontractor.id, { name, email, phone });
    toast.add({
      title: "Subunternehmer aktualisiert",
      description: `Die Daten von ${name} wurden gespeichert.`,
      type: "success",
    });
    setEditOpen(false);
  }

  function handleDeleteSubcontractor() {
    if (!subcontractor) return;
    const confirmed = window.confirm(
      `Möchten Sie ${subcontractor.name} wirklich unwiderruflich löschen?`
    );
    if (!confirmed) return;
    deleteSubcontractor(subcontractor.id);
    toast.add({
      title: "Subunternehmer gelöscht",
      description: `${subcontractor.name} wurde entfernt.`,
      type: "success",
    });
    router.push("/dashboard");
  }

  function handleDeleteDocument(documentId: string, docType: string) {
    if (!subcontractor) return;
    const confirmed = window.confirm(
      `Möchten Sie das Dokument "${docType}" wirklich löschen?`
    );
    if (!confirmed) return;
    deleteDocument(subcontractor.id, documentId);
    toast.add({
      title: "Dokument gelöscht",
      description: `"${docType}" wurde entfernt.`,
      type: "success",
    });
  }

  if (!subcontractor) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Button nativeButton={false} render={<Link href="/dashboard" />} variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Subunternehmer nicht gefunden.
            <div className="mt-4">
              <Button nativeButton={false} render={<Link href="/dashboard" />}>
                Zurück zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Button nativeButton={false} render={<Link href="/dashboard" />} variant="ghost">
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{subcontractor.name}</CardTitle>
            <CardDescription className="space-y-1">
              <div>{subcontractor.email ?? "Keine E-Mail hinterlegt"}</div>
              <div>{subcontractor.phone ?? "Keine Telefonnummer hinterlegt"}</div>
            </CardDescription>
            <StatusBadge status={subcontractor.status} />
          </div>
          <div className="flex shrink-0 gap-2">
            <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
              <DialogTrigger render={<Button variant="outline" />}>
                Bearbeiten
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Subunternehmer bearbeiten</DialogTitle>
                  <DialogDescription>
                    Aktualisieren Sie die Kontaktdaten des Subunternehmers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">E-Mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefon</Label>
                    <Input
                      id="edit-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveEdit} disabled={!name.trim()}>
                    Speichern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={handleDeleteSubcontractor}>
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Dokumente</CardTitle>
            <CardDescription>
              Alle hochgeladenen Nachweise für diesen Subunternehmer.
            </CardDescription>
          </div>
          <UploadModal subcontractors={[subcontractor]} onUploaded={() => {}} />
        </CardHeader>
        <CardContent>
          {subcontractor.documents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Noch keine Dokumente hochgeladen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumenttyp</TableHead>
                  <TableHead>Ausstellungsdatum</TableHead>
                  <TableHead>Ablaufdatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zusammenfassung</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontractor.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.doc_type}</TableCell>
                    <TableCell>{doc.issue_date ?? "—"}</TableCell>
                    <TableCell>{doc.expiration_date ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      {doc.extracted_data?.summary ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.doc_type)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
