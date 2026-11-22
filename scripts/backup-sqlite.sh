#!/usr/bin/env bash
# Online SQLite backup (WAL-safe via .backup) for SPST library *.db files.
# Usage: ./scripts/backup-sqlite.sh [dest-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-$ROOT/.backups/sqlite-$(date +%Y%m%d-%H%M%S)}"
SRC="$ROOT/src"

mkdir -p "$DEST"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Chýba sqlite3 (brew install sqlite / apt install sqlite3)." >&2
  exit 1
fi

echo "==> SQLite backup → $DEST"

count=0
while IFS= read -r -d '' db; do
  rel="${db#"$ROOT/"}"
  # Skip obj/bin noise if any .db leaked there
  case "$rel" in
    */bin/*|*/obj/*|*/node_modules/*) continue ;;
  esac
  name="$(basename "$db")"
  out="$DEST/$name"
  echo "  · $rel"
  sqlite3 "$db" ".backup '$out'"
  # companion WAL/SHM are folded into the backup file
  count=$((count + 1))
done < <(find "$SRC" -type f \( -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' \) -print0 2>/dev/null)

if [[ "$count" -eq 0 ]]; then
  echo "  (žiadne .db pod $SRC — spusti stack aspoň raz)"
else
  echo "==> Hotovo: $count súbor(ov) v $DEST"
  echo "Obnova: ./scripts/restore-sqlite.sh $DEST"
fi
