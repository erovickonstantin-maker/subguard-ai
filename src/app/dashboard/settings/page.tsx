"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useDemoStore, PLAN_LABEL } from "@/lib/demo-store";

export default function SettingsPage() {
  const { settings, user, updateSettings } = useDemoStore();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);

  const [notifyByEmail, setNotifyByEmail] = useState(settings.notifyByEmail);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(
    settings.notifyDaysBefore
  );

  const handleSaveProfile = () => {
    updateSettings({ companyName, contactEmail });
    toast.add({
      title: "Einstellungen gespeichert",
      description: "Ihr Unternehmensprofil wurde aktualisiert.",
      type: "success",
    });
  };

  const handleSaveNotifications = () => {
    updateSettings({ notifyByEmail, notifyDaysBefore });
    toast.add({
      title: "Einstellungen gespeichert",
      description: "Ihre Benachrichtigungseinstellungen wurden aktualisiert.",
      type: "success",
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">
          Verwalten Sie Ihr Unternehmensprofil, Benachrichtigungen und Ihren Plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unternehmensprofil</CardTitle>
          <CardDescription>
            Diese Angaben werden auf Dokumenten und in Benachrichtigungen verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Firmenname</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mustermann Bau GmbH"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Kontakt-E-Mail</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="kontakt@firma.de"
            />
          </div>
          <Button onClick={handleSaveProfile}>Speichern</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungen</CardTitle>
          <CardDescription>
            Legen Sie fest, wie und wann Sie über ablaufende Dokumente informiert werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="notifyByEmail"
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="notifyByEmail">Per E-Mail benachrichtigen</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notifyDaysBefore">Tage vor Ablauf warnen</Label>
            <Input
              id="notifyDaysBefore"
              type="number"
              min={1}
              max={90}
              value={notifyDaysBefore}
              onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
              className="max-w-[8rem]"
            />
          </div>
          <Button onClick={handleSaveNotifications}>Speichern</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Ihr aktuelles Abonnement.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <span className="text-lg font-semibold">
            {user ? PLAN_LABEL[user.plan] : "-"}
          </span>
          <Button
            render={<Link href="/dashboard/billing" />}
            nativeButton={false}
            variant="outline"
          >
            Plan verwalten
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
