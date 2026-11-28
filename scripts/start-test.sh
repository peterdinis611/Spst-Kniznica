#!/usr/bin/env bash
# Lokálny test mode: celý stack s SQLite na backende (nie Postgres).
#
# Usage:
#   ./scripts/start-test.sh
#   ./scripts/start-test.sh --detach
#   ./scripts/start-test.sh --fresh          # zmaž *.db a nechaj seed
#   ./scripts/start-test.sh --skip-docker    # bez Redis/Kafka/Rabbit
#   ./start-test.sh                         # root alias
#
# Vynúti:
#   - ASPNETCORE_ENVIRONMENT=Development
#   - Database__Provider=Sqlite  (aj keď .env má PostgreSql)
#   - Entra__Enabled=false + SPST_DEV_ADMIN=1 (staff bez MSAL)
#   - bez Storybook
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARGS=("--test" "--skip-storybook")

for arg in "$@"; do
  case "$arg" in
    --detach|-d) ARGS+=("--detach") ;;
    --foreground|-f) ARGS+=("--foreground") ;;
    --skip-docker) ARGS+=("--skip-docker") ;;
    --skip-build) ARGS+=("--skip-build") ;;
    --no-stop) ARGS+=("--no-stop") ;;
    --fresh) ARGS+=("--fresh") ;;
    --observability) ARGS+=("--observability") ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [options]

  Spustí SPST knižnicu v test móde so SQLite (Development + DevAuth).

Options:
  --detach, -d       na pozadí
  --foreground, -f   v popredí (default)
  --fresh            zmaž lokálne SQLite *.db pred štartom (čistý seed)
  --skip-docker      bez Docker Compose
  --skip-build       bez dotnet build
  --no-stop          pred štartom nezastavuj bežiace procesy
  --observability    Prometheus + Grafana

Stop:  ./stop.sh
EOF
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      echo "Use --help" >&2
      exit 1
      ;;
  esac
done

exec "$ROOT/scripts/start-all.sh" "${ARGS[@]}"
