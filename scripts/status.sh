#!/usr/bin/env bash
# Stav bežiacich služieb SPST stacku.
# Exit 1 ak padne core (web/gateway/book/booking) alebo kritický disk/Redis.
set -euo pipefail

FAILED_CORE=0
WARNINGS=0

check() {
  local name="$1"
  local url="$2"
  local core="${3:-0}"
  if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
    printf "  ✓ %-12s %s\n" "$name" "$url"
  else
    printf "  ✗ %-12s %s\n" "$name" "$url"
    if [[ "$core" -eq 1 ]]; then
      FAILED_CORE=1
    fi
  fi
}

check_disk() {
  local path="${1:-.}"
  local avail_kb
  avail_kb="$(df -k "$path" | awk 'NR==2 {print $4}')"
  local avail_mb=$((avail_kb / 1024))
  if [[ "$avail_mb" -lt 512 ]]; then
    printf "  ✗ %-12s %s MB free (< 512 MB)\n" "disk" "$avail_mb"
    FAILED_CORE=1
  elif [[ "$avail_mb" -lt 2048 ]]; then
    printf "  ! %-12s %s MB free (low)\n" "disk" "$avail_mb"
    WARNINGS=1
  else
    printf "  ✓ %-12s %s MB free\n" "disk" "$avail_mb"
  fi
}

check_redis() {
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h 127.0.0.1 -p 6379 ping 2>/dev/null | grep -qi pong; then
      printf "  ✓ %-12s %s\n" "redis" "127.0.0.1:6379"
    else
      printf "  ✗ %-12s %s\n" "redis" "127.0.0.1:6379"
      WARNINGS=1
      echo "      (Production s RequireRedis=true bez Redis nenštartuje; AllowMemoryFallback=true = soft-start)"
    fi
  elif command -v docker >/dev/null 2>&1; then
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -qi pong; then
      printf "  ✓ %-12s %s\n" "redis" "docker compose"
    else
      printf "  ! %-12s %s\n" "redis" "nedostupný / redis-cli chýba"
      WARNINGS=1
    fi
  else
    printf "  ! %-12s %s\n" "redis" "redis-cli/docker nedostupné — skip"
    WARNINGS=1
  fi
}

echo "==> SPST Knižnica – status"
echo
check_disk "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check_redis
echo
check "web"        "http://127.0.0.1:3000" 1
check "storybook"  "http://127.0.0.1:6006"
check "gateway"   "http://127.0.0.1:5200/health" 1
check "metrics"   "http://127.0.0.1:5200/metrics"
check "book"      "http://127.0.0.1:5203/health" 1
check "category"  "http://127.0.0.1:5204/health"
check "messaging" "http://127.0.0.1:5205/health"
check "cache"     "http://127.0.0.1:5206/health"
check "author"    "http://127.0.0.1:5207/health"
check "booking"   "http://127.0.0.1:5208/health" 1
check "workers"   "http://127.0.0.1:5209/health"
check "auth"      "http://127.0.0.1:5210/health"
check "admin"     "http://127.0.0.1:5211/health"
check "email"     "http://127.0.0.1:5212/health"

if [[ "$FAILED_CORE" -ne 0 ]]; then
  echo
  echo "Core služby (web/gateway/book/booking) nie sú ready alebo disk je kriticky plný."
  echo "Skús: ./scripts/restart-unhealthy.sh · záloha: ./scripts/backup-sqlite.sh"
  exit 1
fi

if [[ "$WARNINGS" -ne 0 ]]; then
  echo
  echo "Varovania vyššie — stack beží, ale skontroluj Redis/disk."
fi
