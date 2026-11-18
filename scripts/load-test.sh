#!/usr/bin/env bash
# Run k6 load scenarios against the SPST stack.
#
# Usage:
#   ./scripts/load-test.sh                  # smoke
#   ./scripts/load-test.sh catalog
#   ./scripts/load-test.sh stress
#   ./scripts/load-test.sh authenticated
#   ./scripts/load-test.sh web
#   ./scripts/load-test.sh smoke http://127.0.0.1:5200
#
# Env:
#   BASE_URL  gateway (default http://127.0.0.1:5200)
#   WEB_URL   Next.js (default http://127.0.0.1:3000)
#   TOKEN     Bearer JWT for authenticated scenario
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCENARIO="${1:-smoke}"
BASE_URL="${2:-${BASE_URL:-http://127.0.0.1:5200}}"
WEB_URL="${WEB_URL:-http://127.0.0.1:3000}"

SCRIPT=""
case "$SCENARIO" in
  smoke) SCRIPT="$ROOT/load/k6/smoke.js" ;;
  catalog) SCRIPT="$ROOT/load/k6/catalog.js" ;;
  stress) SCRIPT="$ROOT/load/k6/stress.js" ;;
  authenticated|auth) SCRIPT="$ROOT/load/k6/authenticated.js" ;;
  web) SCRIPT="$ROOT/load/k6/web.js" ;;
  *)
    echo "Unknown scenario: $SCENARIO"
    echo "Use: smoke | catalog | stress | authenticated | web"
    exit 1
    ;;
esac

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. Install: brew install k6"
  exit 1
fi

if [[ "$SCENARIO" != "web" ]]; then
  echo "==> Probe gateway ${BASE_URL}/health"
  if ! curl -fsS --max-time 3 "${BASE_URL}/health" >/dev/null; then
    echo "Gateway not reachable at ${BASE_URL}."
    echo "Start stack: ./start.sh --detach"
    exit 1
  fi
  echo "  ✓ live"
else
  echo "==> Probe web ${WEB_URL}"
  if ! curl -fsS --max-time 3 "${WEB_URL}/" >/dev/null; then
    echo "Frontend not reachable at ${WEB_URL}."
    exit 1
  fi
  echo "  ✓ live"
fi

echo "==> k6 ${SCENARIO} → ${SCRIPT}"
export BASE_URL WEB_URL
exec k6 run \
  -e "BASE_URL=${BASE_URL}" \
  -e "WEB_URL=${WEB_URL}" \
  -e "TOKEN=${TOKEN:-}" \
  "$SCRIPT"
