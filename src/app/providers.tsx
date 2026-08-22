"use client";

import { DemoStoreProvider } from "@/lib/demo-store";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      <Toaster>{children}</Toaster>
    </DemoStoreProvider>
  );
}
