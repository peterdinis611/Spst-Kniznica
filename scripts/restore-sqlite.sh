#!/usr/bin/env bash
# Restore SQLite *.db from a backup directory created by backup-sqlite.sh.
# Stops nothing — stop the stack first: ./scripts/stop-all.sh
# Usage: ./scripts/restore-sqlite.sh <backup-dir>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_BACKUP="${1:-}"

if [[ -z "$SRC_BACKUP" || ! -d "$SRC_BACKUP" ]]; then
  echo "Usage: $0 <backup-dir>" >&2
  exit 1
fi

echo "==> Restore SQLite from $SRC_BACKUP"
echo "    Uisti sa, že služby sú zastavené (./scripts/stop-all.sh)."

restored=0
for db in "$SRC_BACKUP"/*.db "$SRC_BACKUP"/*.sqlite "$SRC_BACKUP"/*.sqlite3; do
  [[ -f "$db" ]] || continue
  name="$(basename "$db")"
  # Prefer service working dirs under src/*/
  targets=()
  while IFS= read -r -d '' cand; do
    targets+=("$cand")
  done < <(find "$ROOT/src" -type f -name "$name" -print0 2>/dev/null)

  if [[ ${#targets[@]} -eq 0 ]]; then
    # Default locations next to each service project
    case "$name" in
      bookings.db) targets=("$ROOT/src/BookingService/bookings.db") ;;
      books.db) targets=("$ROOT/src/BookService/books.db") ;;
      *)
        echo "  ? neznámy $name — skopíruj ručne"
        continue
        ;;
    esac
  fi

  for target in "${targets[@]}"; do
    mkdir -p "$(dirname "$target")"
    cp -f "$db" "$target"
    # Drop stale WAL so the restored main db is authoritative
    rm -f "${target}-wal" "${target}-shm"
    echo "  ✓ $name → $target"
    restored=$((restored + 1))
  done
done

if [[ "$restored" -eq 0 ]]; then
  echo "Žiadne súbory obnovené." >&2
  exit 1
fi

echo "==> Obnovené: $restored"
