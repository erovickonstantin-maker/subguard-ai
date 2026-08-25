"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Trash2,
  Plus,
  Download,
  Upload,
  Mountain,
  Check,
  Share,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Status = "Offen" | "In Planung" | "In Arbeit" | "Erledigt";
type Category = "Außenbereich" | "Haus" | "Technik & Infrastruktur" | "Sonstiges";

interface Task {
  id: string;
  title: string;
  category: Category;
  status: Status;
  done: boolean;
  note: string;
  createdAt: number;
}

const STATUSES: Status[] = ["Offen", "In Planung", "In Arbeit", "Erledigt"];
const CATEGORIES: Category[] = [
  "Außenbereich",
  "Haus",
  "Technik & Infrastruktur",
  "Sonstiges",
];

const STORAGE_KEY = "berghaus-todos";

function makeTask(
  title: string,
  category: Category,
  status: Status = "Offen"
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    category,
    status,
    done: status === "Erledigt",
    note: "",
    createdAt: Date.now(),
  };
}

function defaultTasks(): Task[] {
  return [
    makeTask("Zaun", "Außenbereich"),
    makeTask("Wald ausschneiden", "Außenbereich"),
    makeTask("Zwei Wassertränken errichten", "Außenbereich"),
    makeTask("Gras säen", "Außenbereich"),
    makeTask("Dach mit Metall verkleiden", "Haus"),
    makeTask("Fliesen im Keller streichen", "Haus"),
    makeTask("Keller einrichten", "Haus"),
    makeTask("Straße", "Technik & Infrastruktur"),
  ];
}

function statusBadgeClasses(status: Status) {
  switch (status) {
    case "Offen":
      return "bg-muted text-muted-foreground";
    case "In Planung":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400";
    case "In Arbeit":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    case "Erledigt":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  }
}

function loadStoredTasks(): Task[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : null;
  } catch {
    return null;
  }
}

const IOS_HINT_DISMISSED_KEY = "berghaus-ios-hint-dismissed";

function isIosSafariBrowserTab(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return isIos && !isStandalone;
}

export default function BerghausPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Sonstiges");
  const [showIosHint, setShowIosHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage once mounted in the browser (window is not
  // available during the static server render of this page).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only hydration from localStorage
    setTasks(loadStoredTasks() ?? defaultTasks());
    setShowIosHint(
      isIosSafariBrowserTab() &&
        !window.localStorage.getItem(IOS_HINT_DISMISSED_KEY)
    );
  }, []);

  function dismissIosHint() {
    setShowIosHint(false);
    try {
      window.localStorage.setItem(IOS_HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  // Persist on every change
  useEffect(() => {
    if (tasks === null) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Speicher voll oder nicht verfügbar – Änderung bleibt nur im Speicher.
    }
  }, [tasks]);

  const grouped = useMemo(() => {
    const map = new Map<Category, Task[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const task of tasks ?? []) {
      map.get(task.category)?.push(task);
    }
    return map;
  }, [tasks]);

  const total = tasks?.length ?? 0;
  const doneCount = tasks?.filter((t) => t.done).length ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, ...patch } : t)) : prev
    );
  }

  function toggleDone(task: Task) {
    const done = !task.done;
    updateTask(task.id, {
      done,
      status: done ? "Erledigt" : task.status === "Erledigt" ? "Offen" : task.status,
    });
  }

  function changeStatus(task: Task, status: Status) {
    updateTask(task.id, { status, done: status === "Erledigt" });
  }

  function deleteTask(id: string) {
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setTasks((prev) => [...(prev ?? []), makeTask(title, newCategory)]);
    setNewTitle("");
  }

  function exportJson() {
    const data = JSON.stringify(tasks ?? [], null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `berghaus-todos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Ungültiges Format");
        const imported: Task[] = parsed.map((raw: Partial<Task>) => ({
          id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
          title: String(raw.title ?? "Ohne Titel"),
          category: CATEGORIES.includes(raw.category as Category)
            ? (raw.category as Category)
            : "Sonstiges",
          status: STATUSES.includes(raw.status as Status)
            ? (raw.status as Status)
            : "Offen",
          done: Boolean(raw.done),
          note: typeof raw.note === "string" ? raw.note : "",
          createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
        }));
        setTasks(imported);
      } catch {
        alert("Die Datei konnte nicht gelesen werden. Bitte eine gültige Berghaus-JSON-Datei wählen.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-dvh bg-muted/30 [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
      {showIosHint && (
        <div className="flex items-start gap-3 bg-primary px-4 py-3 text-sm text-primary-foreground [padding-top:calc(env(safe-area-inset-top)+0.75rem)]">
          <Share className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">
            Tipp: Tippe unten auf <strong>Teilen</strong> und dann auf{" "}
            <strong>„Zum Home-Bildschirm“</strong>, um Berghaus wie eine App
            zu öffnen.
          </p>
          <button
            type="button"
            aria-label="Hinweis schließen"
            onClick={dismissIosHint}
            className="shrink-0 rounded-md p-1 hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Berghaus – offene Arbeiten
            </h1>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {doneCount} von {total} erledigt
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-6">
        {/* Add task */}
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="Neue Aufgabe hinzufügen…"
              className="h-11 flex-1 text-base"
            />
            <div className="flex gap-2">
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as Category)}
              >
                <SelectTrigger className="h-11 flex-1 text-base sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addTask}
                size="lg"
                className="h-11 shrink-0 px-4"
                disabled={!newTitle.trim()}
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Hinzufügen</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task groups */}
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const items = grouped.get(cat) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">
                  {cat}
                </h2>
                <div className="space-y-3">
                  {items.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "transition-colors",
                        task.done && "bg-muted/40"
                      )}
                    >
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={task.done}
                            aria-label={
                              task.done
                                ? "Als offen markieren"
                                : "Als erledigt markieren"
                            }
                            onClick={() => toggleDone(task)}
                            className={cn(
                              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                              task.done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background"
                            )}
                          >
                            {task.done && <Check className="h-4 w-4" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-base font-medium break-words",
                                task.done &&
                                  "text-muted-foreground line-through"
                              )}
                            >
                              {task.title}
                            </p>
                            <span
                              className={cn(
                                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                statusBadgeClasses(task.status)
                              )}
                            >
                              {task.status}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label="Aufgabe löschen"
                            onClick={() => deleteTask(task.id)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Select
                            value={task.status}
                            onValueChange={(v) =>
                              changeStatus(task, v as Status)
                            }
                          >
                            <SelectTrigger className="h-10 w-full text-sm sm:w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            value={task.note}
                            onChange={(e) =>
                              updateTask(task.id, { note: e.target.value })
                            }
                            placeholder="Notiz (optional)…"
                            className="h-10 flex-1 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {total === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              Noch keine Aufgaben. Füge oben die erste hinzu.
            </p>
          )}
        </div>

        {/* Export / Import */}
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 sm:flex-row">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={exportJson}
          >
            <Download className="h-4 w-4" />
            Als JSON exportieren
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            JSON importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJson(file);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Daten werden lokal in diesem Browser gespeichert (localStorage).
          Für die Synchronisation zwischen mehreren Geräten JSON exportieren
          und auf dem anderen Gerät importieren.
        </p>
      </main>
    </div>
  );
}
