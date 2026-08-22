"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  DocumentRecord,
  DocumentType,
  ExtractedDocumentData,
  SubcontractorWithDocuments,
} from "@/types";

export type PlanKey = "starter" | "pro" | "enterprise";

export interface DemoUser {
  email: string;
  companyName: string;
  plan: PlanKey;
}

interface DemoState {
  user: DemoUser | null;
  subcontractors: SubcontractorWithDocuments[];
}

const STORAGE_KEY = "subguard_demo_state_v1";

const SEED_STATE: DemoState = {
  user: null,
  subcontractors: [],
};

function seedSubcontractors(): SubcontractorWithDocuments[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const mk = (
    id: string,
    name: string,
    email: string,
    docType: DocumentType,
    expiresInDays: number,
    isValid = true
  ): SubcontractorWithDocuments => {
    const expirationDate = new Date(now + expiresInDays * day)
      .toISOString()
      .slice(0, 10);
    const issueDate = new Date(now - 200 * day).toISOString().slice(0, 10);
    const status =
      expiresInDays < 0 ? "expired" : expiresInDays <= 14 ? "expiring_soon" : "active";

    const document: DocumentRecord = {
      id: `${id}-doc`,
      subcontractor_id: id,
      doc_type: docType,
      file_url: "#",
      issue_date: issueDate,
      expiration_date: expirationDate,
      status,
      extracted_data: {
        document_type: docType,
        subcontractor_name: name,
        issue_date: issueDate,
        expiration_date: expirationDate,
        is_valid: isValid,
        summary: `${docType} für ${name}, automatisch erkannt.`,
      },
      created_at: new Date(now - 5 * day).toISOString(),
    };

    return {
      id,
      company_id: "demo-company",
      name,
      email,
      phone: null,
      status,
      created_at: new Date(now - 30 * day).toISOString(),
      documents: [document],
    };
  };

  return [
    mk("sub-1", "Müller Elektro GmbH", "kontakt@mueller-elektro.de", "Haftpflichtversicherung", 120),
    mk("sub-2", "Bau-Team Schulz", "info@bauteam-schulz.de", "Freistellungsbescheinigung", 9),
    mk("sub-3", "Dach & Fassade Kowalski", "kowalski@dach-fassade.de", "Gewerbeanmeldung", -14, false),
  ];
}

interface DemoStoreValue {
  user: DemoUser | null;
  subcontractors: SubcontractorWithDocuments[];
  isHydrated: boolean;
  login: (email: string, companyName: string) => void;
  logout: () => void;
  selectPlan: (plan: PlanKey) => void;
  addSubcontractor: (input: { name: string; email: string; phone: string }) => string;
  extractDocument: (
    subcontractorId: string,
    file: File
  ) => Promise<ExtractedDocumentData>;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

const MOCK_EXTRACTIONS: ExtractedDocumentData[] = [
  {
    document_type: "Haftpflichtversicherung",
    subcontractor_name: "",
    issue_date: null,
    expiration_date: null,
    is_valid: true,
    summary: "Gültiger Nachweis der Betriebshaftpflichtversicherung erkannt.",
  },
  {
    document_type: "Freistellungsbescheinigung",
    subcontractor_name: "",
    issue_date: null,
    expiration_date: null,
    is_valid: true,
    summary: "Freistellungsbescheinigung nach § 48b EStG erkannt.",
  },
  {
    document_type: "Gewerbeanmeldung",
    subcontractor_name: "",
    issue_date: null,
    expiration_date: null,
    is_valid: true,
    summary: "Aktive Gewerbeanmeldung erkannt.",
  },
];

function statusFromExpiration(expirationDate: string | null, isValid: boolean) {
  if (!isValid) return "invalid" as const;
  if (!expirationDate) return "active" as const;
  const days = Math.ceil(
    (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "expired" as const;
  if (days <= 14) return "expiring_soon" as const;
  return "active" as const;
}

function aggregateSubcontractorStatus(documents: DocumentRecord[]) {
  if (documents.some((doc) => doc.status === "expired" || doc.status === "invalid")) {
    return "expired" as const;
  }
  if (documents.some((doc) => doc.status === "expiring_soon")) {
    return "expiring_soon" as const;
  }
  return "active" as const;
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => {
    if (typeof window === "undefined") return SEED_STATE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as DemoState;
    } catch {
      // fall through to seeded state
    }
    return { user: null, subcontractors: seedSubcontractors() };
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Marks that we're on the client so the persisted/seeded state (read
    // synchronously in useState above) can be safely rendered without a
    // server/client markup mismatch. Standard mount-flag idiom.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isHydrated]);

  const login = useCallback((email: string, companyName: string) => {
    setState((prev) => ({
      ...prev,
      user: { email, companyName, plan: prev.user?.plan ?? "starter" },
    }));
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const selectPlan = useCallback((plan: PlanKey) => {
    setState((prev) =>
      prev.user ? { ...prev, user: { ...prev.user, plan } } : prev
    );
  }, []);

  const addSubcontractor = useCallback(
    (input: { name: string; email: string; phone: string }) => {
      const id = `sub-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        subcontractors: [
          {
            id,
            company_id: "demo-company",
            name: input.name,
            email: input.email || null,
            phone: input.phone || null,
            status: "active",
            created_at: new Date().toISOString(),
            documents: [],
          },
          ...prev.subcontractors,
        ],
      }));
      return id;
    },
    []
  );

  const extractDocument = useCallback(
    async (subcontractorId: string, file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const sub = state.subcontractors.find((s) => s.id === subcontractorId);
      const template =
        MOCK_EXTRACTIONS[
          Math.floor(Math.random() * MOCK_EXTRACTIONS.length)
        ];
      const expirationDate = new Date(
        Date.now() + (7 + Math.floor(Math.random() * 100)) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);
      const issueDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const extracted: ExtractedDocumentData = {
        ...template,
        subcontractor_name: sub?.name ?? "Unbekannt",
        issue_date: issueDate,
        expiration_date: expirationDate,
      };

      const status = statusFromExpiration(
        extracted.expiration_date,
        extracted.is_valid
      );

      const document: DocumentRecord = {
        id: `doc-${Date.now()}`,
        subcontractor_id: subcontractorId,
        doc_type: extracted.document_type,
        file_url: "#",
        issue_date: extracted.issue_date,
        expiration_date: extracted.expiration_date,
        status,
        extracted_data: extracted,
        created_at: new Date().toISOString(),
      };

      void file;

      setState((prev) => ({
        ...prev,
        subcontractors: prev.subcontractors.map((s) => {
          if (s.id !== subcontractorId) return s;
          const documents = [document, ...s.documents];
          return { ...s, status: aggregateSubcontractorStatus(documents), documents };
        }),
      }));

      return extracted;
    },
    [state.subcontractors]
  );

  const value = useMemo<DemoStoreValue>(
    () => ({
      user: state.user,
      subcontractors: state.subcontractors,
      isHydrated,
      login,
      logout,
      selectPlan,
      addSubcontractor,
      extractDocument,
    }),
    [state, isHydrated, login, logout, selectPlan, addSubcontractor, extractDocument]
  );

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return ctx;
}

export const PLAN_LABEL: Record<PlanKey, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};
