"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoStore } from "@/lib/demo-store";
import type { ExtractedDocumentData, Subcontractor } from "@/types";

interface UploadModalProps {
  subcontractors: Subcontractor[];
  onUploaded: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadModal({ subcontractors, onUploaded }: UploadModalProps) {
  const { extractDocument } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [subcontractorId, setSubcontractorId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractedDocumentData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setFile(null);
    setSubcontractorId("");
    setState("idle");
    setErrorMessage("");
    setExtracted(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file || !subcontractorId) return;

    setState("uploading");
    setErrorMessage("");

    try {
      const result = await extractDocument(subcontractorId, file);
      setExtracted(result);
      setState("success");
      onUploaded();
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unbekannter Fehler."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UploadCloud className="h-4 w-4" />
        Dokument hochladen
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
          <DialogDescription>
            Laden Sie ein PDF oder Bild hoch. Unsere KI extrahiert automatisch
            Dokumenttyp, Ablaufdatum und Gültigkeit.
          </DialogDescription>
        </DialogHeader>

        {state === "success" && extracted ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 font-medium text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Dokument erfolgreich analysiert
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Typ</dt>
              <dd>{extracted.document_type}</dd>
              <dt className="text-muted-foreground">Subunternehmer</dt>
              <dd>{extracted.subcontractor_name}</dd>
              <dt className="text-muted-foreground">Ablaufdatum</dt>
              <dd>{extracted.expiration_date ?? "—"}</dd>
              <dt className="text-muted-foreground">Gültig</dt>
              <dd>{extracted.is_valid ? "Ja" : "Nein"}</dd>
              <dt className="text-muted-foreground">Zusammenfassung</dt>
              <dd>{extracted.summary}</dd>
            </dl>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subcontractor">Subunternehmer</Label>
              <Select
                value={subcontractorId}
                onValueChange={(value) => setSubcontractorId(value ?? "")}
              >
                <SelectTrigger id="subcontractor" className="w-full">
                  <SelectValue placeholder="Subunternehmer auswählen">
                    {(value: string | null) =>
                      subcontractors.find((sub) => sub.id === value)?.name ??
                      "Subunternehmer auswählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Dokument (PDF, PNG, JPEG, WEBP)</Label>
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-input px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
              />
            </div>

            {state === "error" && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {state === "success" ? (
            <Button onClick={() => setOpen(false)}>Schließen</Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!file || !subcontractorId || state === "uploading"}
            >
              {state === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {state === "uploading" ? "Analysiere…" : "Hochladen & Analysieren"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
