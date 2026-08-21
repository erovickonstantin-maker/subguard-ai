export type SubcontractorStatus = "active" | "expiring_soon" | "expired";

export type DocumentStatus = "active" | "expiring_soon" | "expired" | "invalid";

export type DocumentType =
  | "Haftpflichtversicherung"
  | "Freistellungsbescheinigung"
  | "Gewerbeanmeldung"
  | "Sonstiges";

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  plan: string;
  created_at: string;
}

export interface Subcontractor {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: SubcontractorStatus;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  subcontractor_id: string;
  doc_type: DocumentType;
  file_url: string;
  issue_date: string | null;
  expiration_date: string | null;
  status: DocumentStatus;
  extracted_data: ExtractedDocumentData | null;
  created_at: string;
}

export interface SubcontractorWithDocuments extends Subcontractor {
  documents: DocumentRecord[];
}

export interface ExtractedDocumentData {
  document_type: DocumentType;
  subcontractor_name: string;
  issue_date: string | null;
  expiration_date: string | null;
  is_valid: boolean;
  summary: string;
}

export interface DashboardKpis {
  totalSubcontractors: number;
  activeDocuments: number;
  expiringSoonDocuments: number;
  expiredDocuments: number;
}
