#!/usr/bin/env bash
# Restore SPST Postgres dumps created by pg-backup.sh.
# Stop the stack first. Usage: ./scripts/pg-restore.sh <backup-dir>
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Usage: $0 <backup-dir>" >&2
  exit 1
fi

HOST="${Database__Postgres__Host:-${POSTGRES_HOST:-127.0.0.1}}"
PORT="${Database__Postgres__Port:-${POSTGRES_PORT:-5432}}"
USER="${Database__Postgres__Username:-${POSTGRES_USER:-spst}}"
export PGPASSWORD="${Database__Postgres__Password:-${POSTGRES_PASSWORD:-spst}}"

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "Chýba pg_restore." >&2
  exit 1
fi

echo "==> Restore from $SRC"
echo "    Uisti sa, že služby sú zastavené."

shopt -s nullglob
for dump in "$SRC"/*.dump; do
  db="$(basename "$dump" .dump)"
  echo "  · $db"
  pg_restore -h "$HOST" -p "$PORT" -U "$USER" -d "$db" --clean --if-exists "$dump" || true
done

echo "==> Hotovo"
