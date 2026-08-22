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

export type TeamRole = "admin" | "member";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  invitedAt: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  plan: PlanKey;
  status: "paid" | "open";
}

export interface CompanySettings {
  companyName: string;
  contactEmail: string;
  notifyByEmail: boolean;
  notifyDaysBefore: number;
}

interface DemoState {
  user: DemoUser | null;
  subcontractors: SubcontractorWithDocuments[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  settings: CompanySettings;
}

const STORAGE_KEY = "subguard_demo_state_v2";

export const PLAN_PRICE: Record<PlanKey, number> = {
  starter: 49,
  pro: 149,
  enterprise: 349,
};

export const PLAN_LIMITS: Record<PlanKey, number> = {
  starter: 15,
  pro: Infinity,
  enterprise: Infinity,
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

function seedTeamMembers(): TeamMember[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "team-1",
      name: "Anna Bauer",
      email: "anna.bauer@subguard.ai",
      role: "admin",
      invitedAt: new Date(now - 60 * day).toISOString(),
    },
    {
      id: "team-2",
      name: "Jonas Weber",
      email: "jonas.weber@subguard.ai",
      role: "member",
      invitedAt: new Date(now - 20 * day).toISOString(),
    },
  ];
}

function seedInvoices(): Invoice[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [0, 1, 2].map((i) => ({
    id: `inv-${i}`,
    date: new Date(now - (i + 1) * 30 * day).toISOString().slice(0, 10),
    amount: PLAN_PRICE.starter,
    plan: "starter" as PlanKey,
    status: "paid" as const,
  }));
}

function defaultSettings(): CompanySettings {
  return {
    companyName: "Mustermann Bau GmbH",
    contactEmail: "demo@subguard.ai",
    notifyByEmail: true,
    notifyDaysBefore: 14,
  };
}

function seedState(): DemoState {
  return {
    user: null,
    subcontractors: seedSubcontractors(),
    teamMembers: seedTeamMembers(),
    invoices: seedInvoices(),
    settings: defaultSettings(),
  };
}

interface DemoStoreValue {
  user: DemoUser | null;
  subcontractors: SubcontractorWithDocuments[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  settings: CompanySettings;
  isHydrated: boolean;
  login: (email: string, companyName: string) => void;
  logout: () => void;
  selectPlan: (plan: PlanKey) => void;
  addSubcontractor: (input: { name: string; email: string; phone: string }) => string;
  updateSubcontractor: (
    id: string,
    input: { name: string; email: string; phone: string }
  ) => void;
  deleteSubcontractor: (id: string) => void;
  deleteDocument: (subcontractorId: string, documentId: string) => void;
  extractDocument: (
    subcontractorId: string,
    file: File
  ) => Promise<ExtractedDocumentData>;
  addTeamMember: (input: { name: string; email: string; role: TeamRole }) => void;
  removeTeamMember: (id: string) => void;
  updateSettings: (input: Partial<CompanySettings>) => void;
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
    if (typeof window === "undefined") return seedState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as DemoState;
    } catch {
      // fall through to seeded state
    }
    return seedState();
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
      settings: { ...prev.settings, companyName, contactEmail: email },
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

  const updateSubcontractor = useCallback(
    (id: string, input: { name: string; email: string; phone: string }) => {
      setState((prev) => ({
        ...prev,
        subcontractors: prev.subcontractors.map((s) =>
          s.id === id
            ? {
                ...s,
                name: input.name,
                email: input.email || null,
                phone: input.phone || null,
              }
            : s
        ),
      }));
    },
    []
  );

  const deleteSubcontractor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subcontractors: prev.subcontractors.filter((s) => s.id !== id),
    }));
  }, []);

  const deleteDocument = useCallback(
    (subcontractorId: string, documentId: string) => {
      setState((prev) => ({
        ...prev,
        subcontractors: prev.subcontractors.map((s) => {
          if (s.id !== subcontractorId) return s;
          const documents = s.documents.filter((doc) => doc.id !== documentId);
          return {
            ...s,
            documents,
            status: documents.length
              ? aggregateSubcontractorStatus(documents)
              : "active",
          };
        }),
      }));
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

  const addTeamMember = useCallback(
    (input: { name: string; email: string; role: TeamRole }) => {
      setState((prev) => ({
        ...prev,
        teamMembers: [
          {
            id: `team-${Date.now()}`,
            name: input.name,
            email: input.email,
            role: input.role,
            invitedAt: new Date().toISOString(),
          },
          ...prev.teamMembers,
        ],
      }));
    },
    []
  );

  const removeTeamMember = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((m) => m.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((input: Partial<CompanySettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...input },
      user: prev.user
        ? {
            ...prev.user,
            companyName: input.companyName ?? prev.user.companyName,
          }
        : prev.user,
    }));
  }, []);

  const value = useMemo<DemoStoreValue>(
    () => ({
      user: state.user,
      subcontractors: state.subcontractors,
      teamMembers: state.teamMembers,
      invoices: state.invoices,
      settings: state.settings,
      isHydrated,
      login,
      logout,
      selectPlan,
      addSubcontractor,
      updateSubcontractor,
      deleteSubcontractor,
      deleteDocument,
      extractDocument,
      addTeamMember,
      removeTeamMember,
      updateSettings,
    }),
    [
      state,
      isHydrated,
      login,
      logout,
      selectPlan,
      addSubcontractor,
      updateSubcontractor,
      deleteSubcontractor,
      deleteDocument,
      extractDocument,
      addTeamMember,
      removeTeamMember,
      updateSettings,
    ]
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
