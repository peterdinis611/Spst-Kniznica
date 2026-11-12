#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"
SRC="$ROOT/src"
WEB="$ROOT/web"
MODE="detach"

for arg in "$@"; do
  case "$arg" in
    --foreground|-f) MODE="foreground" ;;
    --detach|-d) MODE="detach" ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [--detach|--foreground]

  --detach      start services with nohup and exit (default)
  --foreground  keep this script attached; Ctrl+C stops everything
EOF
      exit 0
      ;;
  esac
done

mkdir -p "$LOG_DIR" "$PID_DIR"

PIDS=()

cleanup() {
  echo
  echo "==> Stopping all processes..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  if [[ -d "$PID_DIR" ]]; then
    for pidfile in "$PID_DIR"/*.pid; do
      [[ -f "$pidfile" ]] || continue
      [[ "$(basename "$pidfile")" == "start-all.pid" ]] && continue
      pid="$(cat "$pidfile" 2>/dev/null || true)"
      if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
      fi
      rm -f "$pidfile"
    done
  fi

  wait 2>/dev/null || true
  echo "==> Done."
}

if [[ "$MODE" == "foreground" ]]; then
  trap cleanup EXIT INT TERM
fi

start_dotnet() {
  local name="$1"
  local project="$2"
  local url="$3"
  local logfile="$LOG_DIR/${name}.log"
  local pidfile="$PID_DIR/${name}.pid"

  echo "  · $name  →  $url"
  local project_dir="$SRC/$(dirname "$project")"
  if [[ "$MODE" == "detach" ]]; then
    (
      cd "$project_dir"
      nohup env \
        ASPNETCORE_ENVIRONMENT=Development \
        ASPNETCORE_URLS="$url" \
        DOTNET_ENVIRONMENT=Development \
        dotnet run --project "$SRC/$project" --no-build --no-launch-profile \
        >"$logfile" 2>&1 &
      echo $! >"$pidfile"
    )
    local pid
    pid="$(cat "$pidfile")"
    PIDS+=("$pid")
    return
  else
    (
      cd "$project_dir"
      ASPNETCORE_ENVIRONMENT=Development \
      ASPNETCORE_URLS="$url" \
      DOTNET_ENVIRONMENT=Development \
        dotnet run --project "$SRC/$project" --no-build --no-launch-profile \
        >"$logfile" 2>&1
    ) &
  fi
  local pid=$!
  PIDS+=("$pid")
  echo "$pid" >"$pidfile"
}

start_frontend() {
  local logfile="$LOG_DIR/web.log"
  local pidfile="$PID_DIR/web.pid"

  if [[ ! -d "$WEB/node_modules" ]]; then
    echo "  · web  →  installing npm dependencies..."
    (cd "$WEB" && npm install) >"$LOG_DIR/web-install.log" 2>&1
  fi

  echo "  · web  →  http://localhost:3000"
  if [[ "$MODE" == "detach" ]]; then
    nohup bash -lc "cd \"$WEB\" && npm run dev -- --hostname 127.0.0.1 --port 3000" \
      >"$logfile" 2>&1 &
  else
    (
      cd "$WEB"
      npm run dev -- --hostname 127.0.0.1 --port 3000 \
        >"$logfile" 2>&1
    ) &
  fi
  local pid=$!
  PIDS+=("$pid")
  echo "$pid" >"$pidfile"
}

wait_http() {
  local name="$1"
  local url="$2"
  local attempts="${3:-40}"

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "  ✓ $name ready"
      return 0
    fi
    sleep 0.5
  done

  echo "  ! $name not ready yet (see $LOG_DIR/${name}.log)"
  return 0
}

echo "==> SPST Knižnica – starting stack ($MODE)"
echo "    root: $ROOT"
echo

if command -v docker >/dev/null 2>&1; then
  echo "==> Docker Compose (Redis / Kafka / RabbitMQ)"
  if docker info >/dev/null 2>&1; then
    if ! (cd "$ROOT" && docker compose up -d); then
      echo "  ! docker compose failed – continuing with apps anyway"
      echo "    Development appsettings keep Kafka/Cache/RabbitMQ disabled."
    fi
  else
    echo "  ! Docker daemon not running – skipping brokers/cache containers"
    echo "    Development appsettings keep Kafka/Cache/RabbitMQ disabled."
  fi
else
  echo "==> Docker not found – skipping brokers/cache containers"
  echo "    Development appsettings keep Kafka/Cache/RabbitMQ disabled."
fi
echo

echo "==> Building .NET solution (once, avoids parallel file locks)"
(
  cd "$SRC"
  dotnet build SpstKniznica.sln -c Debug --nologo -v q
)
echo

echo "==> .NET services"
start_dotnet "author"     "AuthorService/AuthorService.csproj"         "http://127.0.0.1:5207"
start_dotnet "category"   "CategoryService/CategoryService.csproj"     "http://127.0.0.1:5204"
start_dotnet "book"       "BookService/BookService.csproj"             "http://127.0.0.1:5203"
start_dotnet "booking"    "BookingService/BookingService.csproj"       "http://127.0.0.1:5208"
start_dotnet "workers"    "WorkersService/WorkersService.csproj"       "http://127.0.0.1:5209"
start_dotnet "messaging"  "MessagingService/MessagingService.csproj"   "http://127.0.0.1:5205"
start_dotnet "cache"      "CacheService/CacheService.csproj"           "http://127.0.0.1:5206"
start_dotnet "auth"       "AuthService/AuthService.csproj"             "http://127.0.0.1:5210"
start_dotnet "admin"      "AdminService/AdminService.csproj"           "http://127.0.0.1:5211"
start_dotnet "gateway"    "GatewayService/GatewayService.csproj"       "http://127.0.0.1:5200"
echo

echo "==> Frontend"
start_frontend
echo

echo "==> Waiting for health endpoints"
wait_http "author"    "http://127.0.0.1:5207/health"
wait_http "category"  "http://127.0.0.1:5204/health"
wait_http "book"      "http://127.0.0.1:5203/health"
wait_http "booking"   "http://127.0.0.1:5208/health"
wait_http "workers"   "http://127.0.0.1:5209/health"
wait_http "messaging" "http://127.0.0.1:5205/health"
wait_http "cache"     "http://127.0.0.1:5206/health"
wait_http "auth"      "http://127.0.0.1:5210/health"
wait_http "admin"     "http://127.0.0.1:5211/health"
wait_http "gateway"   "http://127.0.0.1:5200/health"
wait_http "web"       "http://127.0.0.1:3000"
echo

cat <<EOF
==> Stack is up

  Frontend     http://localhost:3000
  Gateway      http://localhost:5200/swagger
  Booking      http://localhost:5208/swagger
  Logs         $LOG_DIR
  Stop         $ROOT/scripts/stop-all.sh

  Tip: for a stack that survives closing the terminal, prefer:
    python3 $ROOT/scripts/start-detached.py
EOF

if [[ "$MODE" == "foreground" ]]; then
  echo
  echo "  Press Ctrl+C to stop everything."
  wait
else
  echo
  echo "  Detached mode – script exits, services keep running."
fi
