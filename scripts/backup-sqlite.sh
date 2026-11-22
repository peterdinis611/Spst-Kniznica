#!/usr/bin/env bash
# Online SQLite backup (WAL-safe via .backup) for SPST library *.db files.
# Usage: ./scripts/backup-sqlite.sh [dest-dir]
# Env:   SPST_BACKUP_KEEP_DAYS=14  (0 = no prune)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$ROOT/.backups"
DEST="${1:-$BACKUP_ROOT/sqlite-$(date +%Y%m%d-%H%M%S)}"
SRC="$ROOT/src"
KEEP_DAYS="${SPST_BACKUP_KEEP_DAYS:-14}"

mkdir -p "$DEST" "$BACKUP_ROOT"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Chýba sqlite3 (brew install sqlite / apt install sqlite3)." >&2
  exit 1
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "==> SQLite backup → $DEST"

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
  log "  (žiadne .db pod $SRC — spusti stack aspoň raz)"
else
  log "==> Hotovo: $count súbor(ov) v $DEST"
  echo "Obnova: ./scripts/restore-sqlite.sh $DEST"
fi

# Prune old dated folders (sqlite-YYYYMMDD-*)
if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && [[ "$KEEP_DAYS" -gt 0 ]]; then
  pruned=0
  while IFS= read -r -d '' old; do
    rm -rf "$old"
    pruned=$((pruned + 1))
  done < <(find "$BACKUP_ROOT" -maxdepth 1 -type d -name 'sqlite-*' -mtime +"$KEEP_DAYS" -print0 2>/dev/null)
  if [[ "$pruned" -gt 0 ]]; then
    log "Prune: odstránených $pruned starších záloh (>$KEEP_DAYS dní)"
  fi
fi
