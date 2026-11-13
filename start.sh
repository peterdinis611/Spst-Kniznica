#!/usr/bin/env bash
# Vstupný bod: spustí celý projekt (Docker + .NET + Next.js).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT/scripts/start-all.sh" "$@"
