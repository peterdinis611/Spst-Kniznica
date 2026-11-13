#!/usr/bin/env bash
# Zastaví celý projekt (porty + PID súbory).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT/scripts/stop-all.sh" "$@"
