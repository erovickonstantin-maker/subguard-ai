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
  Search,
  ChevronDown,
  TreePine,
  Home,
  Wrench,
  ListChecks,
  PartyPopper,
  Pencil,
  User,
  Trash,
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
type Priority = "Niedrig" | "Mittel" | "Hoch";
type StatusFilter = "Alle" | Status;
type SortBy = "neu" | "prioritaet" | "az";

interface Task {
  id: string;
  title: string;
  category: Category;
  status: Status;
  done: boolean;
  note: string;
  priority: Priority;
  assignee: string;
  createdAt: number;
}

const STATUSES: Status[] = ["Offen", "In Planung", "In Arbeit", "Erledigt"];
const CATEGORIES: Category[] = [
  "Außenbereich",
  "Haus",
  "Technik & Infrastruktur",
  "Sonstiges",
];
const PRIORITIES: Priority[] = ["Niedrig", "Mittel", "Hoch"];
const PRIORITY_ORDER: Record<Priority, number> = {
  Hoch: 0,
  Mittel: 1,
  Niedrig: 2,
};

const STORAGE_KEY = "berghaus-todos";
const IOS_HINT_DISMISSED_KEY = "berghaus-ios-hint-dismissed";

const CATEGORY_ICONS: Record<Category, typeof Home> = {
  Außenbereich: TreePine,
  Haus: Home,
  "Technik & Infrastruktur": Wrench,
  Sonstiges: ListChecks,
};

const CATEGORY_ACCENT: Record<Category, string> = {
  Außenbereich: "border-l-emerald-500",
  Haus: "border-l-sky-500",
  "Technik & Infrastruktur": "border-l-amber-500",
  Sonstiges: "border-l-violet-500",
};

const CATEGORY_ICON_COLOR: Record<Category, string> = {
  Außenbereich: "text-emerald-600 dark:text-emerald-400",
  Haus: "text-sky-600 dark:text-sky-400",
  "Technik & Infrastruktur": "text-amber-600 dark:text-amber-400",
  Sonstiges: "text-violet-600 dark:text-violet-400",
};

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
    priority: "Mittel",
    assignee: "",
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

function normalizeTask(raw: Partial<Task>): Task {
  return {
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
    priority: PRIORITIES.includes(raw.priority as Priority)
      ? (raw.priority as Priority)
      : "Mittel",
    assignee: typeof raw.assignee === "string" ? raw.assignee : "",
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
  };
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

function priorityDotClasses(priority: Priority) {
  switch (priority) {
    case "Hoch":
      return "bg-red-500";
    case "Mittel":
      return "bg-amber-500";
    case "Niedrig":
      return "bg-slate-400";
  }
}

function loadStoredTasks(): Task[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeTask);
  } catch {
    return null;
  }
}

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Alle");
  const [sortBy, setSortBy] = useState<SortBy>("neu");
  const [collapsed, setCollapsed] = useState<Set<Category>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
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

  const total = tasks?.length ?? 0;
  const doneCount = tasks?.filter((t) => t.done).length ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      Alle: tasks?.length ?? 0,
      Offen: 0,
      "In Planung": 0,
      "In Arbeit": 0,
      Erledigt: 0,
    };
    for (const t of tasks ?? []) counts[t.status]++;
    return counts;
  }, [tasks]);

  const filteredAndGrouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = (tasks ?? []).filter((t) => {
      if (statusFilter !== "Alle" && t.status !== statusFilter) return false;
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        t.note.toLowerCase().includes(query) ||
        t.assignee.toLowerCase().includes(query)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "az") return a.title.localeCompare(b.title, "de");
      if (sortBy === "prioritaet")
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return b.createdAt - a.createdAt;
    });

    const map = new Map<Category, Task[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const task of sorted) {
      map.get(task.category)?.push(task);
    }
    return map;
  }, [tasks, search, statusFilter, sortBy]);

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

  function clearCompleted() {
    if (doneCount === 0) return;
    if (!window.confirm(`${doneCount} erledigte Aufgabe(n) löschen?`)) return;
    setTasks((prev) => (prev ? prev.filter((t) => !t.done) : prev));
  }

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setTasks((prev) => [...(prev ?? []), makeTask(title, newCategory)]);
    setNewTitle("");
  }

  function toggleCollapsed(cat: Category) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function startEditingTitle(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function commitEditingTitle() {
    if (editingId) {
      const trimmed = editingTitle.trim();
      if (trimmed) updateTask(editingId, { title: trimmed });
    }
    setEditingId(null);
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
        setTasks(parsed.map(normalizeTask));
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
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  allDone ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-6">
        {allDone && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
            <PartyPopper className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Alles erledigt am Berghaus – stark! 🎉
            </p>
          </div>
        )}

        {/* Add task */}
        <Card className="mb-4">
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

        {/* Search, filter & sort */}
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen (Titel, Notiz, Zuständig)…"
                className="h-11 pl-9 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["Alle", ...STATUSES] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    statusFilter === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s} ({statusCounts[s]})
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="h-10 w-full text-sm sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neu">Sortieren: Neueste zuerst</SelectItem>
                  <SelectItem value="prioritaet">Sortieren: Priorität</SelectItem>
                  <SelectItem value="az">Sortieren: A–Z</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="h-10"
                disabled={doneCount === 0}
                onClick={clearCompleted}
              >
                <Trash className="h-4 w-4" />
                Erledigte löschen ({doneCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task groups */}
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = filteredAndGrouped.get(cat) ?? [];
            if (items.length === 0) return null;
            const isCollapsed = collapsed.has(cat);
            const catDone = items.filter((t) => t.done).length;
            const Icon = CATEGORY_ICONS[cat];
            return (
              <section key={cat}>
                <button
                  type="button"
                  onClick={() => toggleCollapsed(cat)}
                  className="mb-3 flex w-full items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", CATEGORY_ICON_COLOR[cat])} />
                  <h2 className="flex-1 text-lg font-semibold tracking-tight">
                    {cat}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {catDone}/{items.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-3">
                    {items.map((task) => (
                      <Card
                        key={task.id}
                        className={cn(
                          "border-l-4 transition-colors",
                          CATEGORY_ACCENT[cat],
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
                              {editingId === task.id ? (
                                <Input
                                  autoFocus
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={commitEditingTitle}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEditingTitle();
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  className="h-9 text-base"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingTitle(task)}
                                  className="group/title flex items-center gap-1.5 text-left"
                                >
                                  <p
                                    className={cn(
                                      "text-base font-medium break-words",
                                      task.done &&
                                        "text-muted-foreground line-through"
                                    )}
                                  >
                                    {task.title}
                                  </p>
                                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/title:opacity-100" />
                                </button>
                              )}

                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                    statusBadgeClasses(task.status)
                                  )}
                                >
                                  {task.status}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      priorityDotClasses(task.priority)
                                    )}
                                  />
                                  {task.priority}
                                </span>
                                {task.assignee && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {task.assignee}
                                  </span>
                                )}
                              </div>
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

                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Select
                              value={task.status}
                              onValueChange={(v) =>
                                changeStatus(task, v as Status)
                              }
                            >
                              <SelectTrigger className="h-10 w-full text-sm">
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

                            <Select
                              value={task.priority}
                              onValueChange={(v) =>
                                updateTask(task.id, { priority: v as Priority })
                              }
                            >
                              <SelectTrigger className="h-10 w-full text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRIORITIES.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {p}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              value={task.assignee}
                              onChange={(e) =>
                                updateTask(task.id, { assignee: e.target.value })
                              }
                              placeholder="Zuständig…"
                              className="col-span-2 h-10 text-sm sm:col-span-1"
                            />

                            <Input
                              value={task.note}
                              onChange={(e) =>
                                updateTask(task.id, { note: e.target.value })
                              }
                              placeholder="Notiz…"
                              className="col-span-2 h-10 text-sm sm:col-span-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {total > 0 &&
            Array.from(filteredAndGrouped.values()).every(
              (items) => items.length === 0
            ) && (
              <p className="py-12 text-center text-muted-foreground">
                Keine Aufgaben gefunden. Suche oder Filter anpassen.
              </p>
            )}

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
