# getthingsdone

## Stack

- **Backend**: ASP.NET Core Web API, .NET 10, minimal APIs (`src/Backend`)
- **Frontend**: Angular 22, Standalone Components (`src/Frontend`)
- **Datenbank**: PostgreSQL 16 (`db` Service in `compose.yaml`)
- **Tests**: xUnit für das Backend (`tests/Backend.Tests`), Karma/Jasmine für das Frontend (`src/Frontend/src/**/*.spec.ts`)
- **Container**: Multi-Stage-Dockerfiles pro Projekt, orchestriert über `compose.yaml` (Podman)

## Projektstruktur

```
src/Backend/         ASP.NET Core Web API
src/Frontend/         Angular-Workspace (inkl. Unit-Tests)
tests/Backend.Tests/  xUnit-Tests für das Backend
compose.yaml          Lokale Orchestrierung von db, backend, frontend
```

## Tests ausführen

Backend (aus dem Repo-Root, nutzt `getthingsdone.sln`):

```bash
dotnet test
```

Frontend (aus `src/Frontend`):

```bash
ng test
```

## Lokal starten

Kompletter Stack (db, backend, frontend) via Podman:

```bash
podman compose up --build
```

- Backend: http://localhost:5000 (Health-Check unter `/health`)
- Frontend: http://localhost:4200
- Datenbank: Postgres auf Port 5432 (intern, nicht standardmäßig nach außen gemappt)

Nach Code-Änderungen im Frontend/Backend immer mit `--build` starten, sonst
wird ein gecachtes altes Image wiederverwendet. Bei bereits laufenden
Containern reicht ein `up --build` allein nicht, um sie auf das neue Image
umzustellen — vorher `podman compose down` (oder gezielt
`podman compose up -d --force-recreate <service>`).

Die Container sprechen sich intern über **feste IP-Adressen** an (nicht über
Service-Namen wie `db`/`backend`) — siehe Kommentar in `compose.yaml`. Grund:
Podmans `aardvark-dns` benötigt für rootless-Networking eine systemd-User-Session;
fehlt die (z. B. unter WSL2 ohne vollständigen Login), startet die
DNS-Auflösung zwischen Containern gar nicht erst.

## Commit-Konventionen

Commits folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Typen: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`.
Beispiel: `feat(backend): add health check endpoint`
