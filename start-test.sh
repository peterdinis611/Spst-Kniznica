#!/usr/bin/env bash
# Test mode: SQLite backend + DevAuth. Pozri scripts/start-test.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT/scripts/start-test.sh" "$@"
