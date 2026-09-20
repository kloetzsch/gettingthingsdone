# Prompts für den aktuellen Stand

Mit diesen Prompts hätte sich der aktuelle Stand direkt erreichen lassen,
ohne den Umweg über Rückfragen und Korrekturen. Gegliedert nach **fachlichen**
Anforderungen (was die App können soll) und **technischen** Anforderungen
(wie es gebaut werden soll).

---

## Fachliche Anforderungen

### Domänenmodell

> Baue ein GTD-inspiriertes Aufgabenmodell mit folgenden fachlichen Regeln:
>
> - **Aufgabe**: Titel (Pflicht), Notiz (optional), Status (`Inbox`,
>   `NextAction`, `WaitingFor`, `SomedayMaybe`, `Done`) — beim Wechsel zu
>   `Done` wird ein Abschlusszeitpunkt automatisch gesetzt, beim Wechsel weg
>   davon wieder entfernt. Dazu Kategorie, Aufwandsschätzung und optional ein
>   Projekt.
> - **Aufwandsschätzung**: keine freie Zahl, sondern eine feste Werteskala,
>   mit der sich trotzdem rechnen lässt (Minuten aufsummieren): 5, 10, 30,
>   60 Minuten, 4 Stunden, 1 Arbeitstag (= 7 Stunden). Pflichtfeld bei jeder
>   Erfassung, auch für Kleinstaufgaben.
> - **Kategorie**: frei anlegbar und löschbar, nur ein Name. Der
>   Kategoriename wird auf der Aufgabe als **Textwert kopiert**, nicht als
>   Fremdschlüssel referenziert — Löschen einer Kategorie darf bestehende
>   Aufgaben nicht verändern, Auswertung nach Kategorietext muss trotzdem
>   möglich bleiben.
> - **Projekt**: Name, gewünschtes Ergebnis, Status (`Active`/`OnHold`/
>   `Completed`). Aufgabe→Projekt ist dagegen eine **echte, referenzielle
>   Beziehung** (optional, beim Löschen des Projekts wird nur die Zuordnung
>   entfernt, die Aufgabe bleibt) — bewusst anders als bei der Kategorie.
> - Kein Orts-/Werkzeug-Attribut (klassisches GTD-"@context" wie `@calls`) —
>   wird nicht gebraucht.

### Oberfläche

> - **Layout**: 3 Spalten. Links Navigation mit drei Punkten — Aufgaben,
>   Projekte, Statistik. Mittig, einheitliche Breite über alle drei Seiten:
>   je ein Erfassungsformular oben, passende Liste/Auswertung darunter.
>   Rechts durchgehend zwei Auswertungs-Widgets (siehe unten). Seitentitel
>   oben zentriert, deutlich größer als der restliche Text; die linke
>   Navigationsspalte schmaler als die anderen beiden; mittleres und rechtes
>   Panel schließen auf allen drei Seiten oben bündig ab.
> - **Aufgaben-Erfassung**: Titel-Eingabe; Aufwand, Kategorie und Projekt
>   jeweils als **Pillen nebeneinander statt Dropdown**. Kategorie-Pillen
>   inkl. "+ Neu"-Option, die inline eine neue Kategorie anlegt und direkt
>   auswählt. Nach dem Absenden: Formular zurücksetzen, Fokus zurück auf das
>   Titelfeld, kurzes visuelles Erfolgsfeedback am Button.
> - **Aufgabenliste** direkt unter dem Formular: nur offene Aufgaben (Status
>   ≠ erledigt), neueste zuerst, Status zusätzlich rechtsbündig in der
>   Kopfzeile jeder Aufgabe. Klick auf eine Aufgabe klappt sie inline zu
>   einem Bearbeitungsbereich auf (Titel, Notiz, Kategorie/Aufwand/Projekt
>   als Pillen, **vollständige Status-Auswahl** über alle GTD-Status, nicht
>   nur ein "Erledigt"-Knopf) mit Speichern- und Abbrechen-Aktion.
> - **Filter für die Aufgabenliste**: nach Status, Aufwand und Projekt
>   filtern, die drei Filter frei kombinierbar, je eine "Alle"-Option zum
>   Zurücksetzen.
> - **Projekte-Ansicht**: gleiche Aufteilung wie bei den Aufgaben —
>   Erfassungsformular (Name, gewünschtes Ergebnis) oben, darunter die Liste
>   aller noch nicht abgeschlossenen Projekte. Klick auf einen Eintrag klappt
>   ihn auf: Name/Ergebnis bearbeitbar, **Status als vollständige Auswahl**
>   (aktiv/pausiert/abgeschlossen), damit sich ein Projekt auch wieder
>   reaktivieren lässt.
> - **Rechte Spalte, oben**: Liste "Heute erledigt" — nur Aufwand und Titel,
>   sortiert nach Abschlusszeitpunkt (neueste zuerst). Direkt neben der
>   Überschrift (nicht darunter), rechtsbündig, in derselben Schriftgröße
>   und -stärke wie die Überschrift selbst: die Gesamtsumme der heute
>   erledigten Zeit im Format "x h y min" (ohne Stunden-Anteil, wenn unter
>   60 Minuten).
> - **Rechte Spalte, darunter**: einfacher Graph mit der Summe der
>   erledigten Minuten pro Tag der letzten 30 Tage.
> - **Statistik-Seite**: Balkendiagramm der erledigten Zeit wie in einem
>   BI-Tool — gruppierbar nach Projekt oder Kategorie, Zeitraum einstellbar
>   (7/30/90 Tage, dieses Jahr), Aggregation nach Tag/Woche/Monat wählbar,
>   alles miteinander kombinierbar. Balkenhöhe bleibt dabei unabhängig von
>   der gewählten Aggregation gleich. Mouseover über einen Balken zeigt
>   sowohl die Summen pro aktuell gruppierter Kategorie/Projekt als auch die
>   Gesamtsumme für diesen Zeitpunkt.
> - **Gesamtes Erscheinungsbild**: auf Angular Material (Material Design)
>   umstellen.

### Beispieldaten

> Beim Start der Gesamt-App (wenn auch die Datenbank hochfährt) automatisch
> 3 Projekte, 4 Kategorien und 100 Aufgaben anlegen — Mischung aus
> erledigten und offenen Aufgaben, verteilt über die vorhandenen Kategorien
> und Projekte, alle mit Erfassungsdatum innerhalb der letzten 7 Tage bis
> jetzt, davon mindestens eine heute abgeschlossen. Diese Beispieldaten
> dürfen nicht entstehen, wenn kein Datenbank-Container hochfährt oder sich
> die App nicht mit der Dev-Datenbank, sondern mit einer echten Datenbank
> verbindet.

---

## Technische Anforderungen

> - **Backend**: ASP.NET-Core-Minimal-API (.NET), EF Core + Npgsql,
>   PostgreSQL. CRUD-Endpoints für Tasks und Projects; für Categories reicht
>   Create/List/Delete. Enums als lesbare Strings serialisieren, nicht als
>   Zahlen. Durchgängig async/await, kein sync-over-async.
> - **Migration & Validierung**: EF-Core-Migration automatisch beim Start
>   anwenden, aber nur für relationale Provider (damit In-Memory-Tests nicht
>   brechen). DB-Check-Constraint auf die erlaubten Aufwands-Minutenwerte,
>   zusätzlich serverseitige Validierung in den Endpoints.
> - **Beispieldaten-Absicherung**: Seed-Logik nur ausführen, wenn
>   `app.Environment.IsDevelopment()` **und** die betroffenen Tabellen leer
>   sind (zweite Absicherung gegen versehentliches Befüllen einer echten
>   Datenbank); dafür `ASPNETCORE_ENVIRONMENT=Development` explizit für den
>   Backend-Service in `compose.yaml` setzen, da diese Datei ausschließlich
>   den lokalen Dev-Stack beschreibt.
> - **Tests**: xUnit mit `WebApplicationFactory` + EF-Core-InMemory-Provider
>   für alle Endpoints, inklusive eines Tests, der belegt, dass Löschen
>   einer Kategorie den Kategorietext auf bestehenden Tasks nicht verändert.
>   Frontend-seitig den kompletten Flow einmal automatisiert (z. B. mit
>   Playwright) durchklicken — Erfassen → Bearbeiten → Erledigt — und dabei
>   auf Konsolenfehler prüfen.
> - **Frontend-Grundgerüst**: Angular Standalone Components mit Signals
>   (kein NgRx). Kategorie-/Projekt-Listen und der Task-Bestand zwischen
>   Formular und Liste teilen (je ein `signal`-basierter Zustand in einem
>   `providedIn: 'root'`-Service), nicht doppelt laden. Angular Router mit
>   den Routen `/dashboard`, `/projects`, `/statistics`; `/` leitet auf
>   `/dashboard` um.
> - **Netzwerk (Dev vs. Container)**: Dev-Proxy (`ng serve` → Backend) und
>   nginx-Reverse-Proxy (`/api`, `/health` → Backend-Container) einrichten,
>   damit das Frontend im Container wie im lokalen Dev-Server ohne CORS
>   auskommt.
> - **Diagramme**: Balkendiagramm-Höhe unabhängig von der Balkenanzahl
>   halten — `preserveAspectRatio="none"` auf dem SVG plus feste CSS-Höhe
>   statt `height: auto` (das sonst an die variable `viewBox`-Breite
>   gekoppelt wäre). Die SVG-Diagramme selbst sind handgebaut (Angular
>   Material bringt dafür keine Komponente mit), nur auf die
>   Material-Farbvariablen (`--mat-sys-*`) umstellen, damit Light/Dark-Modus
>   automatisch mitläuft.
> - **Angular Material**: `@angular/material`, `@angular/cdk`,
>   `@angular/animations` einführen; Material-3-Theme mit automatischer
>   Light/Dark-Unterstützung (`color-scheme: light dark`);
>   `provideAnimationsAsync()` einbinden. Bestehende UI-Bausteine auf
>   Material-Komponenten umstellen: `mat-toolbar` (Kopfzeile),
>   `mat-sidenav-container` mit zwei `mat-sidenav` (statt eigenem
>   CSS-Grid-Layout), `mat-nav-list` (Navigation), `mat-card` (Formulare und
>   Widgets), `mat-form-field`/`matInput` (Texteingaben),
>   `mat-button-toggle-group` (bisherige "Pillen"), `mat-accordion`/
>   `mat-expansion-panel` (Aufklapp-Listen bei Aufgaben und Projekten).

---

## Umgebungs-Falle: Podman/WSL-Netzwerk

Kein Prompt im eigentlichen Sinn, sondern eine Umgebungs-Falle, die sich so
oder so erst beim ersten echten `podman compose up` gezeigt hätte: Unter
rootless Podman ohne funktionierende systemd-User-Session (z. B. WSL2 ohne
vollständigen Login) startet `aardvark-dns` nicht, wodurch sich Container
nicht per Service-Name (`db`, `backend`) finden. Falls das auftritt: feste
IP-Adressen im Compose-Netz statt DNS-Namen verwenden (siehe Kommentar in
`compose.yaml`).
