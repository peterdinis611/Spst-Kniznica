#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT/.run/pids"

echo "==> Stopping SPST processes..."

if [[ -d "$PID_DIR" ]]; then
  for pidfile in "$PID_DIR"/*.pid; do
    [[ -f "$pidfile" ]] || continue
    name="$(basename "$pidfile" .pid)"
    pid="$(cat "$pidfile" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "  · stopping $name (pid $pid)"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  done
fi

# Fallback: kill known ports if something was started outside the script.
for port in 3000 5200 5203 5204 5205 5206 5207 5208 5209 5210 5211; do
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids:-}" ]]; then
      echo "  · freeing :$port"
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
    fi
  fi
done

echo "==> Done."
