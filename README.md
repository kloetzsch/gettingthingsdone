# getthingsdone

GTD-inspirierte Aufgabenverwaltung (ASP.NET Core Backend, Angular Frontend,
PostgreSQL). Für Stack, Projektstruktur, lokales Starten und Tests siehe
[`CLAUDE.md`](./CLAUDE.md).

## Datenbank-Backups

Die Postgres-Daten liegen in einem Podman-Volume (`getthingsdone_db-data`)
und überleben normale `podman compose down`/`up`-Zyklen. Die rohen
Datendateien direkt zu sichern funktioniert aber nicht ohne Weiteres: Postgres
setzt sein Datenverzeichnis im Container auf `chmod 0700`, Eigentümer ist die
containerinterne UID 999 - durch die User-Namespace-Zuordnung von rootless
Podman landet das auf dem Host als eine UID, die zu keinem echten Benutzer
gehört. Weder dein eigener Benutzer noch Windows-Backup-Tools kommen da ohne
Weiteres ran.

Deshalb läuft das Backup über **`pg_dump`**: Es verbindet sich als normaler
Datenbank-Client mit der laufenden Datenbank und schreibt die Ausgabedatei
mit den Rechten des aufrufenden Nutzers - damit ist sie ganz normal lesbar
und kopierbar, auch von Windows aus.

### Manuell ausführen

```bash
./scripts/backup-db.sh
```

Schreibt einen komprimierten Dump nach `~/.backups/getthingsdone/` (Format:
`getthingsdone_YYYYMMDD_HHMMSS.sql.gz`) und löscht dabei automatisch Backups,
die älter als 14 Tage sind. Beides lässt sich per Umgebungsvariable
überschreiben:

```bash
BACKUP_DIR=/anderer/pfad RETENTION_DAYS=30 ./scripts/backup-db.sh
```

Der Container muss dafür laufen (`podman compose up -d`).

### Automatisierung

Aktuell **nicht** eingerichtet — bewusst manuell, aus zwei Gründen:

- Ein fester Cron-Zeitpunkt (z. B. nachts) bringt nichts, wenn der Rechner zu
  der Zeit ohnehin nie an ist.
- systemd läuft in dieser WSL2-Umgebung nicht zuverlässig genug, um sich auf
  zeitgesteuerte Jobs (Cron, systemd-Timer) verlassen zu können.

Bis dahin: `./scripts/backup-db.sh` von Hand ausführen, wenn ein Backup
gewünscht ist.

### Von Windows aus zugreifen

Die Backup-Dateien liegen unter `~/.backups/getthingsdone/` und sind - anders
als die rohen Postgres-Datendateien - normal lesbar. Von Windows aus
erreichbar über:

```
\\wsl.localhost\Ubuntu-26.04\home\knuffi631\.backups\getthingsdone\
```

Von dort aus mit jedem gewünschten Windows-Backup-Tool weitersichern.

### Wiederherstellen

```bash
zcat ~/.backups/getthingsdone/getthingsdone_20260101_030000.sql.gz | \
  podman exec -i getthingsdone_db_1 psql -U getthingsdone -d getthingsdone
```

Vorher die Zieldatenbank leeren (z. B. Container-Volume neu anlegen), sonst
gibt es Konflikte mit bereits vorhandenen Tabellen/Daten.
