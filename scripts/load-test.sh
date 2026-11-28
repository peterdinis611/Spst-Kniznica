#!/usr/bin/env bash
# Run k6 load scenarios against the SPST stack.
#
# Usage:
#   ./scripts/load-test.sh                  # smoke
#   ./scripts/load-test.sh try              # ~45s through the Next app + BFF
#   ./scripts/load-test.sh catalog
#   ./scripts/load-test.sh authors
#   ./scripts/load-test.sh categories
#   ./scripts/load-test.sh search
#   ./scripts/load-test.sh health
#   ./scripts/load-test.sh rate-limit      # needs --loadtest for 429
#   ./scripts/load-test.sh bff
#   ./scripts/load-test.sh seo
#   ./scripts/load-test.sh favorites
#   ./scripts/load-test.sh breakpoint
#   ./scripts/load-test.sh chaos-read
#   ./scripts/load-test.sh stress
#   ./scripts/load-test.sh spike
#   ./scripts/load-test.sh soak
#   ./scripts/load-test.sh summaries
#   ./scripts/load-test.sh authenticated
#   ./scripts/load-test.sh desk
#   ./scripts/load-test.sh web
#   ./scripts/load-test.sh smoke http://127.0.0.1:5200
#
# Env:
#   BASE_URL      gateway (default http://127.0.0.1:5200)
#   WEB_URL       Next.js (default http://127.0.0.1:3000)
#   TOKEN         Bearer JWT for authenticated / desk / favorites
#   PROFILE       smoke | load | stress (thresholds)
#   SOAK_MINUTES  soak duration (default 10)
#
# Prod-like limits (Redis 429): start stack with ./start.sh --detach --loadtest
# then run this script. Plain Development keeps rate limits practically off.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCENARIO="${1:-smoke}"
BASE_URL="${2:-${BASE_URL:-http://127.0.0.1:5200}}"
WEB_URL="${WEB_URL:-http://127.0.0.1:3000}"

SCRIPT=""
DEFAULT_PROFILE="load"
NEED_GATEWAY=1
NEED_WEB=0
case "$SCENARIO" in
  smoke) SCRIPT="$ROOT/load/k6/smoke.ts"; DEFAULT_PROFILE=smoke ;;
  try) SCRIPT="$ROOT/load/k6/try.ts"; NEED_WEB=1 ;;
  catalog) SCRIPT="$ROOT/load/k6/catalog.ts" ;;
  authors) SCRIPT="$ROOT/load/k6/authors.ts" ;;
  categories) SCRIPT="$ROOT/load/k6/categories.ts" ;;
  search) SCRIPT="$ROOT/load/k6/search.ts" ;;
  health) SCRIPT="$ROOT/load/k6/health.ts" ;;
  rate-limit|ratelimit) SCRIPT="$ROOT/load/k6/rate-limit.ts"; DEFAULT_PROFILE=stress ;;
  bff) SCRIPT="$ROOT/load/k6/bff.ts"; NEED_WEB=1 ;;
  seo) SCRIPT="$ROOT/load/k6/seo.ts"; NEED_GATEWAY=0; NEED_WEB=1 ;;
  favorites|fav) SCRIPT="$ROOT/load/k6/favorites.ts" ;;
  breakpoint|break) SCRIPT="$ROOT/load/k6/breakpoint.ts"; DEFAULT_PROFILE=stress ;;
  chaos-read|chaos) SCRIPT="$ROOT/load/k6/chaos-read.ts" ;;
  stress) SCRIPT="$ROOT/load/k6/stress.ts"; DEFAULT_PROFILE=stress ;;
  spike) SCRIPT="$ROOT/load/k6/spike.ts"; DEFAULT_PROFILE=stress ;;
  soak) SCRIPT="$ROOT/load/k6/soak.ts" ;;
  summaries|summary) SCRIPT="$ROOT/load/k6/summaries.ts" ;;
  authenticated|auth) SCRIPT="$ROOT/load/k6/authenticated.ts" ;;
  desk) SCRIPT="$ROOT/load/k6/desk.ts" ;;
  web) SCRIPT="$ROOT/load/k6/web.ts"; NEED_GATEWAY=0; NEED_WEB=1 ;;
  mixed) SCRIPT="$ROOT/load/k6/mixed.ts" ;;
  *)
    echo "Unknown scenario: $SCENARIO"
    echo "Use: try | smoke | catalog | authors | categories | search | health |"
    echo "     rate-limit | bff | seo | favorites | breakpoint | chaos-read |"
    echo "     stress | spike | soak | summaries | authenticated | desk | web | mixed"
    exit 1
    ;;
esac
PROFILE="${PROFILE:-$DEFAULT_PROFILE}"

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. Install: brew install k6"
  exit 1
fi

if [[ "$NEED_GATEWAY" == "1" ]]; then
  echo "==> Probe gateway ${BASE_URL}/health"
  if ! curl -fsS --max-time 3 "${BASE_URL}/health" >/dev/null; then
    echo "Gateway not reachable at ${BASE_URL}."
    echo "Start stack: ./start.sh --detach"
    exit 1
  fi
  echo "  ✓ live"
fi
if [[ "$NEED_WEB" == "1" ]]; then
  echo "==> Probe web ${WEB_URL}"
  if ! curl -fsS --max-time 3 "${WEB_URL}/" >/dev/null; then
    echo "Frontend not reachable at ${WEB_URL}."
    echo "Start stack: ./start.sh --detach"
    exit 1
  fi
  echo "  ✓ live"
fi

echo "==> k6 ${SCENARIO} (PROFILE=${PROFILE}) → ${SCRIPT}"
export BASE_URL WEB_URL PROFILE
exec k6 run \
  -e "BASE_URL=${BASE_URL}" \
  -e "WEB_URL=${WEB_URL}" \
  -e "WEB_BFF=${WEB_URL}" \
  -e "TOKEN=${TOKEN:-}" \
  -e "PROFILE=${PROFILE}" \
  -e "SOAK_MINUTES=${SOAK_MINUTES:-10}" \
  "$SCRIPT"
