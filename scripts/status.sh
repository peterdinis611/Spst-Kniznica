#!/usr/bin/env bash
# Stav bežiacich služieb SPST stacku.
set -euo pipefail

check() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
    printf "  ✓ %-12s %s\n" "$name" "$url"
  else
    printf "  ✗ %-12s %s\n" "$name" "$url"
  fi
}

echo "==> SPST Knižnica – status"
echo
check "web"       "http://127.0.0.1:3000"
check "gateway"   "http://127.0.0.1:5200/health"
check "book"      "http://127.0.0.1:5203/health"
check "category"  "http://127.0.0.1:5204/health"
check "messaging" "http://127.0.0.1:5205/health"
check "cache"     "http://127.0.0.1:5206/health"
check "author"    "http://127.0.0.1:5207/health"
check "booking"   "http://127.0.0.1:5208/health"
check "workers"   "http://127.0.0.1:5209/health"
check "auth"      "http://127.0.0.1:5210/health"
check "admin"     "http://127.0.0.1:5211/health"
