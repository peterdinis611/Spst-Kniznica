#!/usr/bin/env bash
# Static gate: Production appsettings must fail-closed on secrets/metrics/signing.
# Does not need live secrets — catches overlay regressions in PR CI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

warn() { echo "  ✗ $*" >&2; FAILED=1; }
ok() { echo "  ✓ $*"; }

echo "==> Production overlay hardening (static)"

shopt -s nullglob
files=("$ROOT"/src/*/appsettings.Production.json)
if [[ ${#files[@]} -eq 0 ]]; then
  warn "No appsettings.Production.json found"
  exit 1
fi

for f in "${files[@]}"; do
  name="$(basename "$(dirname "$f")")"
  if grep -q '"AllowInsecureDefaultKey"[[:space:]]*:[[:space:]]*true' "$f"; then
    warn "$name: AllowInsecureDefaultKey=true in Production overlay"
  fi
  if grep -q '"RequireSigning"[[:space:]]*:[[:space:]]*false' "$f"; then
    warn "$name: RequireSigning=false in Production overlay"
  fi
  if grep -q '"AllowMemoryFallback"[[:space:]]*:[[:space:]]*true' "$f"; then
    warn "$name: AllowMemoryFallback=true in Production overlay"
  fi
  if ! grep -q '"RequireKey"[[:space:]]*:[[:space:]]*true' "$f"; then
    # Gateway / Workers always map metrics; require key on every Production overlay we ship.
    warn "$name: Metrics:RequireKey is not true"
  else
    ok "$name Metrics:RequireKey"
  fi
done

echo
if [[ "$FAILED" -ne 0 ]]; then
  echo "Production overlays failed hardening checks." >&2
  exit 1
fi
echo "Production overlays: OK"
