#!/usr/bin/env bash
# Production host entrypoint (school VPS).
# Usage:
#   SPST_ENV_FILE=/etc/spst/kniznica.env ./scripts/run-production.sh --detach
#   ./scripts/run-production.sh --detach   # uses .env.production
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARGS=("--production" "--skip-storybook")

for arg in "$@"; do
  case "$arg" in
    --detach|-d) ARGS+=("--detach") ;;
    --skip-docker) ARGS+=("--skip-docker") ;;
    --skip-build) ARGS+=("--skip-build") ;;
    --observability) ARGS+=("--observability") ;;
    --no-stop) ARGS+=("--no-stop") ;;
    -h|--help)
      echo "Usage: $(basename "$0") [--detach] [--skip-docker] [--skip-build] [--observability]"
      echo "Set SPST_ENV_FILE=/etc/spst/kniznica.env or provide .env.production"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 1
      ;;
  esac
done

exec "$ROOT/scripts/start-all.sh" "${ARGS[@]}"
