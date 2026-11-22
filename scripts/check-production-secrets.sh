#!/usr/bin/env bash
# Fail closed if Production-ish env still has placeholder secrets.
# Usage: ./scripts/check-production-secrets.sh
# Honours env already exported or loaded from repo .env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

FAILED=0
warn() { echo "  ✗ $*" >&2; FAILED=1; }
ok() { echo "  ✓ $*"; }

echo "==> Production secrets / hardening check"
echo

ENV_NAME="${ASPNETCORE_ENVIRONMENT:-Production}"
if [[ "$ENV_NAME" == "Development" || "$ENV_NAME" == "LoadTest" ]]; then
  echo "  · ASPNETCORE_ENVIRONMENT=$ENV_NAME (soft mode — warnings only for placeholders)"
fi

KEY="${InternalApi__SharedKey:-}"
DEFAULT_KEY="spst-dev-internal-key-change-me"
if [[ -z "$KEY" || "$KEY" == "$DEFAULT_KEY" ]]; then
  warn "InternalApi__SharedKey chýba alebo je placeholder"
elif [[ ${#KEY} -lt 32 ]]; then
  warn "InternalApi__SharedKey má menej ako 32 znakov"
else
  ok "InternalApi__SharedKey nastavený"
fi

ALLOW_INSECURE="${InternalApi__AllowInsecureDefaultKey:-false}"
if [[ "$ALLOW_INSECURE" == "true" && "$ENV_NAME" == "Production" ]]; then
  warn "InternalApi__AllowInsecureDefaultKey=true v Production"
else
  ok "AllowInsecureDefaultKey nie je zapnutý pre Production"
fi

ENTRA="${Entra__Enabled:-false}"
if [[ "$ENTRA" != "true" && "$ENV_NAME" == "Production" ]]; then
  warn "Entra__Enabled nie je true (Production by mal používať Entra)"
else
  ok "Entra__Enabled=$ENTRA"
fi

SITE="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-${Cors__SiteUrl:-}}}"
if [[ -z "$SITE" || "$SITE" == *"localhost"* ]]; then
  warn "SITE_URL / NEXT_PUBLIC_SITE_URL vyzerá lokálne — CORS pre katalóg (CATALOG_DIRECT) zlyhá vonku"
else
  ok "SITE_URL=$SITE"
fi

HTTPS="${ASPNETCORE_URLS:-}"
if [[ "$ENV_NAME" == "Production" && "$HTTPS" != *"https"* ]]; then
  echo "  · tip: nastav HTTPS (proxy/HSTS) — ASPNETCORE_URLS=$HTTPS"
fi

echo
if [[ "$FAILED" -ne 0 ]]; then
  if [[ "$ENV_NAME" == "Development" || "$ENV_NAME" == "LoadTest" ]]; then
    echo "Hardening: nájdené slabiny (povolené v $ENV_NAME)."
    exit 0
  fi
  echo "Hardening: oprav secrets pred Production." >&2
  exit 1
fi

echo "Hardening: OK"
