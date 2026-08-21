import { NextRequest, NextResponse } from "next/server";
import {
  anthropic,
  DOCUMENT_EXTRACTION_MODEL,
  DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedDocumentData } from "@/types";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function statusFromExpiration(expirationDate: string | null, isValid: boolean) {
  if (!isValid) return "invalid" as const;
  if (!expirationDate) return "active" as const;

  const expiresAt = new Date(expirationDate);
  const now = new Date();
  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration < 0) return "expired" as const;
  if (daysUntilExpiration <= 14) return "expiring_soon" as const;
  return "active" as const;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const subcontractorId = formData.get("subcontractor_id");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei übergeben." }, { status: 400 });
    }
    if (typeof subcontractorId !== "string" || subcontractorId.length === 0) {
      return NextResponse.json(
        { error: "subcontractor_id ist erforderlich." },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Nur PDF, PNG, JPEG oder WEBP werden unterstützt." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const documentBlock =
      file.type === "application/pdf"
        ? ({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          } as const)
        : ({
            type: "image",
            source: {
              type: "base64",
              media_type: file.type as "image/png" | "image/jpeg" | "image/webp",
              data: base64Data,
            },
          } as const);

    const message = await anthropic.messages.create({
      model: DOCUMENT_EXTRACTION_MODEL,
      max_tokens: 1024,
      system: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            documentBlock,
            {
              type: "text",
              text: "Extrahiere die Daten aus diesem Dokument als reines JSON-Objekt.",
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "KI-Antwort enthielt keinen Text." },
        { status: 502 }
      );
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Konnte kein JSON aus der KI-Antwort extrahieren." },
        { status: 502 }
      );
    }

    const extracted = JSON.parse(jsonMatch[0]) as ExtractedDocumentData;

    const storagePath = `${user.id}/${subcontractorId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload fehlgeschlagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath);

    const status = statusFromExpiration(extracted.expiration_date, extracted.is_valid);

    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        subcontractor_id: subcontractorId,
        doc_type: extracted.document_type,
        file_url: publicUrl,
        issue_date: extracted.issue_date,
        expiration_date: extracted.expiration_date,
        status,
        extracted_data: extracted,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Speichern fehlgeschlagen: ${insertError.message}` },
        { status: 500 }
      );
    }

    await supabase
      .from("subcontractors")
      .update({ status })
      .eq("id", subcontractorId);

    return NextResponse.json({ document, extracted });
  } catch (error) {
    console.error("extract-document error:", error);
    return NextResponse.json(
      { error: "Unerwarteter Fehler bei der Dokumentenanalyse." },
      { status: 500 }
    );
  }
}
