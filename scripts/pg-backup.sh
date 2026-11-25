#!/usr/bin/env bash
# Dump all SPST Postgres service databases.
# Usage: ./scripts/pg-backup.sh [dest-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-$ROOT/.backups/pg-$(date +%Y%m%d-%H%M%S)}"
HOST="${Database__Postgres__Host:-${POSTGRES_HOST:-127.0.0.1}}"
PORT="${Database__Postgres__Port:-${POSTGRES_PORT:-5432}}"
USER="${Database__Postgres__Username:-${POSTGRES_USER:-spst}}"
export PGPASSWORD="${Database__Postgres__Password:-${POSTGRES_PASSWORD:-spst}}"

DBS=(spst_book spst_booking spst_author spst_category spst_email spst_admin spst_auth spst_messaging)

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Chýba pg_dump (brew install libpq / apt install postgresql-client)." >&2
  exit 1
fi

mkdir -p "$DEST"
echo "==> Postgres backup → $DEST (host=$HOST port=$PORT)"

for db in "${DBS[@]}"; do
  echo "  · $db"
  pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$db" -Fc -f "$DEST/${db}.dump"
done

echo "==> Hotovo. Obnova: ./scripts/pg-restore.sh $DEST"
