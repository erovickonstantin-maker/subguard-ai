Berghaus – offene Arbeiten
==========================

Eine schlanke, mobilfreundliche To-do-Liste für die Arbeiten am „Serbien Berghaus", gebaut mit [Next.js](https://nextjs.org).

## Starten

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` im Browser öffnen.

## Funktionen

- Aufgaben gruppiert nach Kategorie (Außenbereich, Haus, Technik & Infrastruktur, Sonstiges) mit farbigen Akzenten und Icons, Kategorien lassen sich ein-/ausklappen
- Checkbox „erledigt", Statusauswahl (Offen / In Planung / In Arbeit / Erledigt), Priorität (Niedrig/Mittel/Hoch), optionales Notiz- und Zuständig-Feld, Löschen
- Aufgabentitel direkt anklickbar bearbeiten
- Neue Aufgaben mit Titel und Kategorie hinzufügen
- Suche (Titel, Notiz, Zuständig), Statusfilter mit Live-Zählern, Sortierung (Neueste/Priorität/A–Z)
- „Erledigte löschen"-Aktion
- Fortschrittsanzeige mit Fortschrittsbalken und Feier-Banner bei 100 %
- Vollständig responsiv, große Bedienelemente, getestet auf Desktop- und iPhone-Breite (390px)
- Als „App" auf dem iPhone-Homescreen installierbar (eigenes Icon, startet ohne Safari-Adressleiste)

## Datenspeicherung

- Alle Änderungen werden sofort im `localStorage` des Browsers gespeichert (Schlüssel `berghaus-todos`). Nach Schließen und erneutem Öffnen der Seite im selben Browser bleiben alle Aufgaben erhalten.
- Es ist kein Backend konfiguriert, daher **synchronisiert die App die Daten nicht automatisch zwischen mehreren Geräten** (z. B. Computer und iPhone) – jedes Gerät hat seinen eigenen Browser-Speicher.
- Für den Datenaustausch zwischen Geräten gibt es unten auf der Seite die Buttons „Als JSON exportieren" und „JSON importieren": Auf einem Gerät exportieren, die Datei auf das andere Gerät übertragen (z. B. per AirDrop/E-Mail) und dort importieren.

## Am iPhone verwenden

1. Die App muss erreichbar sein (lokal im selben WLAN über die IP des Rechners, oder deployed, z. B. via Vercel).
2. Im iPhone-Browser (Safari) die Adresse öffnen. Safari zeigt beim ersten Besuch automatisch einen Hinweis-Banner mit der Anleitung zum Hinzufügen.
3. Über „Teilen → Zum Home-Bildschirm" ein App-Icon anlegen. Die Seite hat ein eigenes Manifest (`manifest.webmanifest`) und eigene Icons, sodass sie danach ohne Browser-Adressleiste, mit eigenem Icon und Namen „Berghaus" wie eine native App startet.
