#!/usr/bin/env bash
# Erstellt einen logischen Backup-Dump (pg_dump) der laufenden
# getthingsdone-Datenbank. Umgeht damit das Rechteproblem der rohen
# Postgres-Datendateien (Container-UID 999, chmod 0700) - siehe README.
#
# Aufruf:       ./scripts/backup-db.sh
# Details:      siehe README, Abschnitt "Datenbank-Backups".
set -euo pipefail

# Rootless Podman braucht diese Variable, wenn das Skript ohne interaktive
# Login-Shell läuft (z. B. aus Cron heraus). Interaktiv ist sie meist
# schon gesetzt, dann greift der Default rechts vom ":-" nicht.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

BACKUP_DIR="${BACKUP_DIR:-$HOME/.backups/getthingsdone}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER="getthingsdone_db_1"
DB_USER="getthingsdone"
DB_NAME="getthingsdone"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
outfile="$BACKUP_DIR/getthingsdone_${timestamp}.sql.gz"
tmpfile="$outfile.tmp"

if ! podman exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner | gzip > "$tmpfile"; then
  echo "Backup fehlgeschlagen (Container '$CONTAINER' erreichbar?)." >&2
  rm -f "$tmpfile"
  exit 1
fi

mv "$tmpfile" "$outfile"
echo "Backup geschrieben: $outfile"

# Alte Backups jenseits der Aufbewahrungsfrist aufräumen.
find "$BACKUP_DIR" -maxdepth 1 -name 'getthingsdone_*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
