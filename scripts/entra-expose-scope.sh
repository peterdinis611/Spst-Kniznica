#!/usr/bin/env bash
# Vytvorí / doplní scope access_as_user v Entra app registration Spst-Kniznica.
set -euo pipefail

CLIENT_ID="e180d2c3-d176-44f5-9d1e-2c5e01f182f9"
TENANT_ID="3cd05ac6-46c1-4798-9df3-062237bfdcc4"
OBJECT_ID="9907b816-0e90-42c8-b67e-7368eebb7272"
APP_ID_URI="api://${CLIENT_ID}"
SCOPE_VALUE="access_as_user"
SCOPE_ID="a4b8c12e-9f3d-4e6a-b1c2-8d7e6f5a4b3c"

usage() {
  cat <<EOF
Použitie: $(basename "$0")

Pred spustením (jednorazovo):
  az login --use-device-code --tenant ${TENANT_ID}

Vytvorí Application ID URI a delegated scope ${SCOPE_VALUE}.
EOF
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

if ! command -v az >/dev/null 2>&1; then
  echo "Nainštaluj Azure CLI: brew install azure-cli" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Potrebné jq: brew install jq" >&2
  exit 1
fi

if ! az account show >/dev/null 2>&1; then
  echo "==> Nie si prihlásený v Azure CLI. Spúšťam device login…"
  az login --use-device-code --tenant "${TENANT_ID}"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="${ROOT}/.run"
mkdir -p "$WORKDIR"

echo "==> Načítavam app registration…"
APP_JSON="$WORKDIR/entra-app.json"
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}" \
  -o json >"$APP_JSON"

HAS_SCOPE="$(jq -r --arg v "${SCOPE_VALUE}" '
  [.api.oauth2PermissionScopes[]? | select(.value == $v)] | length
' "$APP_JSON")"

if [[ "$HAS_SCOPE" != "0" ]]; then
  echo "✓ Scope ${SCOPE_VALUE} už existuje — nič netreba."
  exit 0
fi

NEW_SCOPE="$(jq -n \
  --arg id "$SCOPE_ID" \
  --arg val "$SCOPE_VALUE" \
  '{
    adminConsentDescription: "Umožní aplikácii volať SPST Knižnica API ako prihlásený používateľ.",
    adminConsentDisplayName: "Access SPST Knižnica as a user",
    id: $id,
    isEnabled: true,
    type: "User",
    userConsentDescription: "Umožní aplikácii volať SPST Knižnica API vo vašom mene.",
    userConsentDisplayName: "Access SPST Knižnica as a user",
    value: $val
  }')"

PAYLOAD="$WORKDIR/entra-api-patch.json"
jq -n \
  --arg uri "$APP_ID_URI" \
  --arg client "$CLIENT_ID" \
  --arg scopeId "$SCOPE_ID" \
  --argjson newScope "$NEW_SCOPE" \
  --argjson app "$(cat "$APP_JSON")" \
  '{
    identifierUris: (([$uri] + ($app.identifierUris // [])) | unique),
    api: (
      ($app.api // {}) +
      {
        requestedAccessTokenVersion: 2,
        oauth2PermissionScopes: ((($app.api.oauth2PermissionScopes // []) + [$newScope])),
        preAuthorizedApplications: (
          ((($app.api.preAuthorizedApplications // []) | map(select(.appId != $client))) +
          [{ appId: $client, delegatedPermissionIds: [$scopeId] }])
        )
      }
    )
  }' >"$PAYLOAD"

echo "==> Pridávam scope ${SCOPE_VALUE}…"
az rest --method PATCH \
  --url "https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}" \
  --headers "Content-Type=application/json" \
  --body "@${PAYLOAD}"

echo "==> Delegated permission + admin consent"
set +e
az ad app permission add \
  --id "${CLIENT_ID}" \
  --api "${CLIENT_ID}" \
  --api-permissions "${SCOPE_ID}=Scope" 2>/dev/null
set -e
az ad app permission admin-consent --id "${CLIENT_ID}" 2>/dev/null || true

echo
echo "✓ Scope je nastavený: ${APP_ID_URI}/${SCOPE_VALUE}"
echo "  Skús znova: http://localhost:3000/login"
