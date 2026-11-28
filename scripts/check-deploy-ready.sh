#!/usr/bin/env bash
# Hard gate before Production host start. Loads optional env file.
# Usage:
#   ./scripts/check-deploy-ready.sh
#   ./scripts/check-deploy-ready.sh /etc/spst/kniznica.env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-}"

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
elif [[ -f "$ROOT/.env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
elif [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

export ASPNETCORE_ENVIRONMENT=Production
export DOTNET_ENVIRONMENT=Production
export SPST_FORCE_ENVIRONMENT=Production
if [[ -n "$ENV_FILE" ]]; then
  export SPST_ENV_FILE="$ENV_FILE"
elif [[ -f "$ROOT/.env.production" ]]; then
  export SPST_ENV_FILE="$ROOT/.env.production"
fi

echo "==> Deploy-ready gate (Production hard mode)"
echo

FAILED=0
fail() { echo "  ✗ $*" >&2; FAILED=1; }
ok() { echo "  ✓ $*"; }

# Overlays (static)
if ! bash "$ROOT/scripts/check-production-overlays.sh"; then
  FAILED=1
fi

echo
# Secrets (force Production semantics — ignores Development in local .env)
if ! bash "$ROOT/scripts/check-production-secrets.sh"; then
  FAILED=1
fi

echo
# Extra deploy checks
SITE="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-}}"
if [[ -z "$SITE" || "$SITE" == *"localhost"* || "$SITE" != https://* ]]; then
  fail "SITE_URL must be public https://… (got: ${SITE:-empty})"
else
  ok "SITE_URL=$SITE"
fi

API="${NEXT_PUBLIC_API_URL:-}"
if [[ -z "$API" || "$API" == *"localhost"* ]]; then
  fail "NEXT_PUBLIC_API_URL must be public (got: ${API:-empty})"
else
  ok "NEXT_PUBLIC_API_URL=$API"
fi

if [[ "${InternalApi__AllowInsecureDefaultKey:-false}" == "true" ]]; then
  fail "InternalApi__AllowInsecureDefaultKey must be false"
else
  ok "AllowInsecureDefaultKey=false"
fi

if [[ "${Database__Provider:-}" != "PostgreSql" && "${Database__Provider:-}" != "Postgres" && "${Database__Provider:-}" != "Npgsql" ]]; then
  fail "Database__Provider must be PostgreSql for Production deploy"
else
  ok "Database__Provider=$Database__Provider"
fi

if [[ -z "${Database__Postgres__Password:-}${POSTGRES_PASSWORD:-}" ]]; then
  fail "Postgres password empty"
else
  ok "Postgres password set"
fi

if [[ "${Smtp__Enabled:-false}" != "true" ]]; then
  echo "  · tip: Smtp__Enabled=false — e-maily pôjdu log-only"
else
  ok "Smtp__Enabled=true"
fi

TEMPLATES="$ROOT/src/EmailService/Templates"
for f in loan-borrowed.html loan-returned.html loan-due-reminder.html waitlist-promotion.html; do
  if [[ ! -f "$TEMPLATES/$f" ]]; then
    fail "Missing email template Templates/$f — run: cd web && npm run emails:build"
  fi
done
ok "Email HTML templates present"

echo
if [[ "$FAILED" -ne 0 ]]; then
  echo "Deploy-ready: FAIL — oprav vyššie a skús znova." >&2
  exit 1
fi
echo "Deploy-ready: OK"
