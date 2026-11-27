#!/usr/bin/env bash
# Migrate local SQLite service DBs into PostgreSQL (database-per-service).
#
# Prerequisites:
#   - docker compose up -d postgres
#   - pgloader installed (brew install pgloader) OR Docker image dimitri/pgloader
#   - stop the .NET stack first (./stop.sh) so SQLite files are quiet
#
# Usage:
#   ./scripts/sqlite-to-postgres.sh
#   PGLOADER_IMAGE=dimitri/pgloader ./scripts/sqlite-to-postgres.sh
#
# After ETL: set Database__Provider=PostgreSql and restart ./start.sh
# (EF Migrate is still required if the PG schema was never created).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PGHOST="${Database__Postgres__Host:-${POSTGRES_HOST:-127.0.0.1}}"
PGPORT="${Database__Postgres__Port:-${POSTGRES_PORT:-5432}}"
PGUSER="${Database__Postgres__Username:-${POSTGRES_USER:-spst}}"
PGPASS="${Database__Postgres__Password:-${POSTGRES_PASSWORD:-spst}}"

# service_dir:sqlite_file:pg_database
MAPPINGS=(
  "BookService:books.db:spst_book"
  "BookingService:bookings.db:spst_booking"
  "AuthorService:authors.db:spst_author"
  "CategoryService:categories.db:spst_category"
  "EmailService:email.db:spst_email"
  "AdminService:admin.db:spst_admin"
  "AuthService:auth.db:spst_auth"
  "MessagingService:messaging.db:spst_messaging"
)

have_pgloader=0
if command -v pgloader >/dev/null 2>&1; then
  have_pgloader=1
fi

run_pgloader() {
  local sqlite_path="$1"
  local pg_db="$2"
  local load_cmd="sqlite:///${sqlite_path}"
  local dest="postgresql://${PGUSER}:${PGPASS}@${PGHOST}:${PGPORT}/${pg_db}"

  if [[ "$have_pgloader" == "1" ]]; then
    pgloader --with "create no tables" --with "data only" "$load_cmd" "$dest" \
      || pgloader "$load_cmd" "$dest"
    return
  fi

  local image="${PGLOADER_IMAGE:-dimitri/pgloader:latest}"
  echo "  · using Docker image $image"
  docker run --rm --network host \
    -v "$ROOT:/work" -w /work \
    "$image" \
    pgloader "sqlite:////work/${sqlite_path#$ROOT/}" "$dest"
}

echo "==> SQLite → PostgreSQL ETL"
echo "    host=${PGHOST}:${PGPORT} user=${PGUSER}"
echo

if ! command -v docker >/dev/null 2>&1 && [[ "$have_pgloader" != "1" ]]; then
  echo "Need pgloader or Docker." >&2
  exit 1
fi

# Ensure Postgres accepts connections
if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; then
  if ! docker exec spst-postgres pg_isready -U "$PGUSER" >/dev/null 2>&1; then
    echo "Postgres is not ready. Start: docker compose up -d postgres" >&2
    exit 1
  fi
fi

migrated=0
for entry in "${MAPPINGS[@]}"; do
  IFS=':' read -r svc sqlite db <<<"$entry"
  src="$ROOT/src/$svc/$sqlite"
  if [[ ! -f "$src" ]]; then
    echo "  · skip $svc ($sqlite missing)"
    continue
  fi
  echo "  → $svc ($sqlite → $db)"
  run_pgloader "$src" "$db"
  migrated=$((migrated + 1))
done

echo
if [[ "$migrated" -eq 0 ]]; then
  echo "No SQLite files found under src/*/."
  exit 1
fi

echo "Done ($migrated DBs). Next:"
echo "  1. Database__Provider=PostgreSql in .env"
echo "  2. Database__Postgres__SslMode=Prefer (local) or Require (managed)"
echo "  3. ./start.sh"
echo "Docs: deploy/postgres/README.md"
