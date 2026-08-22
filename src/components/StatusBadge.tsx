import { Badge } from "@/components/ui/badge";

export const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  expiring_soon: "Läuft bald ab",
  expired: "Abgelaufen",
  invalid: "Ungültig",
};

export const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  expiring_soon: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  expired: "bg-red-100 text-red-700 hover:bg-red-100",
  invalid: "bg-red-100 text-red-700 hover:bg-red-100",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_STYLE[status] ?? ""}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
