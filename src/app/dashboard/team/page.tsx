"use client";

import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useDemoStore, type TeamRole } from "@/lib/demo-store";

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  member: "Mitglied",
};

export default function TeamPage() {
  const { teamMembers, addTeamMember, removeTeamMember } = useDemoStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");

  function resetForm() {
    setName("");
    setEmail("");
    setRole("member");
  }

  function handleInvite() {
    if (!name.trim() || !email.trim()) return;

    addTeamMember({ name: name.trim(), email: email.trim(), role });
    toast.add({
      title: "Team-Mitglied eingeladen",
      description: `${name.trim()} wurde als ${ROLE_LABELS[role]} hinzugefügt.`,
      type: "success",
    });
    setOpen(false);
    resetForm();
  }

  function handleRemove(id: string, memberName: string) {
    const confirmed = window.confirm(
      `Möchten Sie ${memberName} wirklich aus dem Team entfernen?`
    );
    if (!confirmed) return;

    removeTeamMember(id);
    toast.add({
      title: "Team-Mitglied entfernt",
      description: `${memberName} wurde aus dem Team entfernt.`,
      type: "success",
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Verwalten Sie, wer in Ihrem Unternehmen Zugriff auf SubGuard AI
            hat.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <DialogTrigger render={<Button />}>
            <UserPlus className="h-4 w-4" />
            Team-Mitglied hinzufügen
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Team-Mitglied hinzufügen</DialogTitle>
              <DialogDescription>
                Laden Sie eine Person per E-Mail zu Ihrem SubGuard AI Konto
                ein.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name</Label>
                <Input
                  id="member-name"
                  placeholder="Max Mustermann"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-email">E-Mail</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="max@unternehmen.de"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-role">Rolle</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRole((value as TeamRole | null) ?? "member")
                  }
                >
                  <SelectTrigger id="member-role" className="w-full">
                    <SelectValue placeholder="Rolle auswählen">
                      {(value: string | null) =>
                        ROLE_LABELS[(value as TeamRole) ?? "member"] ??
                        "Rolle auswählen"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Mitglied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleInvite}
                disabled={!name.trim() || !email.trim()}
              >
                Einladen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team-Mitglieder</CardTitle>
          <CardDescription>
            {teamMembers.length}{" "}
            {teamMembers.length === 1 ? "Mitglied" : "Mitglieder"} mit Zugriff
            auf dieses Konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Noch keine Team-Mitglieder.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Eingeladen am</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "admin" ? "secondary" : "outline"
                        }
                      >
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.invitedAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id, member.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Entfernen
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
