"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoStore, PLAN_LABEL } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/billing", label: "Abrechnung", icon: CreditCard },
  { href: "/dashboard/reports", label: "Berichte", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Einstellungen", icon: Settings },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isHydrated } = useDemoStore();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center text-muted-foreground">
        {isHydrated ? (
          <>
            <ShieldCheck className="h-8 w-8" />
            <p className="text-sm">Weiterleitung zur Anmeldung…</p>
          </>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b bg-muted/30 px-4 py-4 md:w-64 md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          SubGuard AI
        </Link>

        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden flex-col gap-3 md:flex">
          <div className="rounded-md border bg-background px-3 py-2 text-xs">
            <p className="font-medium">{user.companyName}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-2">
              {PLAN_LABEL[user.plan]}-Plan
            </Badge>
          </div>
          <Button variant="ghost" className="justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
