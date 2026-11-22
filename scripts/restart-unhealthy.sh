#!/usr/bin/env bash
# Restart .NET services whose /health check fails (single-host resilience).
# Requires a prior ./start.sh --detach so .run/pids exists.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$ROOT/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"
SRC="$ROOT/src"
DOTNET_ENV="${ASPNETCORE_ENVIRONMENT:-Development}"
RESTARTED=0

# name|project|listen
SERVICES=(
  "gateway|GatewayService/GatewayService.csproj|http://127.0.0.1:5200"
  "book|BookService/BookService.csproj|http://127.0.0.1:5203"
  "category|CategoryService/CategoryService.csproj|http://127.0.0.1:5204"
  "messaging|MessagingService/MessagingService.csproj|http://127.0.0.1:5205"
  "cache|CacheService/CacheService.csproj|http://127.0.0.1:5206"
  "author|AuthorService/AuthorService.csproj|http://127.0.0.1:5207"
  "booking|BookingService/BookingService.csproj|http://127.0.0.1:5208"
  "workers|WorkersService/WorkersService.csproj|http://127.0.0.1:5209"
  "auth|AuthService/AuthService.csproj|http://127.0.0.1:5210"
  "admin|AdminService/AdminService.csproj|http://127.0.0.1:5211"
  "email|EmailService/EmailService.csproj|http://127.0.0.1:5212"
)

restart_one() {
  local name="$1"
  local project="$2"
  local listen="$3"
  local pidfile="$PID_DIR/${name}.pid"
  local logfile="$LOG_DIR/${name}.log"
  local project_dir="$SRC/$(dirname "$project")"

  if [[ -f "$pidfile" ]]; then
    local old
    old="$(cat "$pidfile" 2>/dev/null || true)"
    if [[ -n "${old:-}" ]] && kill -0 "$old" 2>/dev/null; then
      kill "$old" 2>/dev/null || true
      sleep 0.5
      kill -9 "$old" 2>/dev/null || true
    fi
  fi

  mkdir -p "$PID_DIR" "$LOG_DIR"
  echo "  → restart $name ($listen)"
  (
    cd "$project_dir"
    nohup env \
      ASPNETCORE_ENVIRONMENT="$DOTNET_ENV" \
      ASPNETCORE_URLS="$listen" \
      DOTNET_ENVIRONMENT="$DOTNET_ENV" \
      dotnet run --project "$SRC/$project" --no-build --no-launch-profile \
      >>"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )
  RESTARTED=$((RESTARTED + 1))
}

echo "==> Kontrola health + reštart padnutých služieb"
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name project listen <<<"$entry"
  if curl -fsS --max-time 1 "${listen}/health" >/dev/null 2>&1; then
    printf "  ✓ %-12s\n" "$name"
    continue
  fi
  printf "  ✗ %-12s → reštart\n" "$name"
  restart_one "$name" "$project" "$listen"
done

if [[ "$RESTARTED" -eq 0 ]]; then
  echo "  Všetky sledované služby sú up."
  exit 0
fi

echo "  Čakám na $RESTARTED reštart(ov)..."
sleep 3
bash "$ROOT/scripts/status.sh"
