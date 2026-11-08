#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"
SRC="$ROOT/src"
WEB="$ROOT/web"

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

  # Also stop anything recorded from a previous run that might still be alive.
  if [[ -d "$PID_DIR" ]]; then
    for pidfile in "$PID_DIR"/*.pid; do
      [[ -f "$pidfile" ]] || continue
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

trap cleanup EXIT INT TERM

start_dotnet() {
  local name="$1"
  local project="$2"
  local url="$3"
  local logfile="$LOG_DIR/${name}.log"
  local pidfile="$PID_DIR/${name}.pid"

  echo "  · $name  →  $url"
  (
    cd "$SRC"
    ASPNETCORE_ENVIRONMENT=Development \
    ASPNETCORE_URLS="$url" \
    DOTNET_ENVIRONMENT=Development \
      dotnet run --project "$project" --no-launch-profile \
      >"$logfile" 2>&1
  ) &
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
  (
    cd "$WEB"
    npm run dev -- --port 3000 \
      >"$logfile" 2>&1
  ) &
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

echo "==> SPST Knižnica – starting stack"
echo "    root: $ROOT"
echo

if command -v docker >/dev/null 2>&1; then
  echo "==> Docker Compose (Redis / Kafka / RabbitMQ)"
  if docker info >/dev/null 2>&1; then
    if ! (cd "$ROOT" && docker compose up -d); then
      echo "  ! docker compose failed – continuing with apps anyway"
    fi
  else
    echo "  ! Docker daemon not running – skipping brokers/cache containers"
  fi
else
  echo "==> Docker not found – skipping brokers/cache containers"
fi
echo

echo "==> .NET services"
start_dotnet "author"     "AuthorService/AuthorService.csproj"         "http://localhost:5207"
start_dotnet "category"   "CategoryService/CategoryService.csproj"     "http://localhost:5204"
start_dotnet "book"       "BookService/BookService.csproj"             "http://localhost:5203"
start_dotnet "booking"    "BookingService/BookingService.csproj"       "http://localhost:5208"
start_dotnet "workers"    "WorkersService/WorkersService.csproj"       "http://localhost:5209"
start_dotnet "messaging"  "MessagingService/MessagingService.csproj"   "http://localhost:5205"
start_dotnet "cache"      "CacheService/CacheService.csproj"           "http://localhost:5206"
start_dotnet "gateway"    "GatewayService/GatewayService.csproj"       "http://localhost:5200"
echo

echo "==> Frontend"
start_frontend
echo

echo "==> Waiting for health endpoints"
wait_http "author"    "http://localhost:5207/health"
wait_http "category"  "http://localhost:5204/health"
wait_http "book"      "http://localhost:5203/health"
wait_http "booking"   "http://localhost:5208/health"
wait_http "workers"   "http://localhost:5209/health"
wait_http "messaging" "http://localhost:5205/health"
wait_http "cache"     "http://localhost:5206/health"
wait_http "gateway"   "http://localhost:5200/health"
wait_http "web"       "http://localhost:3000"
echo

cat <<EOF
==> Stack is up

  Frontend     http://localhost:3000
  Gateway      http://localhost:5200/swagger
  Book         http://localhost:5203/swagger
  Category     http://localhost:5204/swagger
  Messaging    http://localhost:5205/swagger
  Cache        http://localhost:5206/swagger
  Author       http://localhost:5207/swagger
  Booking      http://localhost:5208/swagger
  Workers      http://localhost:5209/swagger  (POST /api/orders/enqueue)

  RabbitMQ UI  http://localhost:15672  (guest/guest)
  Logs         $LOG_DIR

  Press Ctrl+C to stop everything.
EOF

# Keep the script alive while children run.
wait
