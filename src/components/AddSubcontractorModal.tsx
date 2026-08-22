"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoStore } from "@/lib/demo-store";
import { toast } from "@/components/ui/toast";

export function AddSubcontractorModal() {
  const { addSubcontractor } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    addSubcontractor({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    toast.add({
      title: "Subunternehmer hinzugefügt",
      description: `${name.trim()} wurde erfolgreich angelegt.`,
      type: "success",
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <UserPlus className="h-4 w-4" />
        Subunternehmer hinzufügen
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subunternehmer hinzufügen</DialogTitle>
          <DialogDescription>
            Legen Sie einen neuen Subunternehmer an, um anschließend Dokumente hochzuladen.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Müller Elektro GmbH"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-email">E-Mail</Label>
            <Input
              id="sub-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="kontakt@beispiel.de"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-phone">Telefon</Label>
            <Input
              id="sub-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+49 30 1234567"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
