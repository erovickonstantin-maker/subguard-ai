import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DOCUMENT_EXTRACTION_MODEL = "claude-3-5-sonnet-20241022";

export const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `Du bist ein Experte für rechtliche Dokumente im Handwerks- und Baugewerbe. Extrahiere aus dem Dokument folgende Daten im reinen JSON-Format: document_type (Haftpflichtversicherung, Freistellungsbescheinigung, Gewerbeanmeldung, Sonstiges), subcontractor_name, issue_date (YYYY-MM-DD), expiration_date (YYYY-MM-DD), is_valid (boolean), summary (1 Satz). Antworte ausschließlich mit dem JSON-Objekt, ohne zusätzlichen Text oder Markdown-Formatierung.`;
