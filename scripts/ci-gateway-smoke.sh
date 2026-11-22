#!/usr/bin/env bash
# Optional local/CI helper: verify gateway liveness + readiness once the stack is up.
# Usage: ./scripts/ci-gateway-smoke.sh [gateway-base-url]
set -euo pipefail

BASE="${1:-http://127.0.0.1:5200}"

echo "==> Gateway live  ${BASE}/health"
curl -fsS --max-time 3 "${BASE}/health" >/dev/null
echo "  ✓ live"

echo "==> Gateway ready ${BASE}/health/ready"
if curl -fsS --max-time 5 "${BASE}/health/ready" >/dev/null; then
  echo "  ✓ ready (book + booking)"
else
  echo "  ✗ ready failed — BookService or BookingService not healthy"
  exit 1
fi

echo "==> Gateway metrics ${BASE}/metrics"
if curl -fsS --max-time 5 "${BASE}/metrics" >/dev/null; then
  echo "  ✓ metrics"
else
  echo "  ✗ metrics missing"
  exit 1
fi
