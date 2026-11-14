#!/usr/bin/env bash
# Spustí celý SPST stack: Docker (Redis/Kafka/RabbitMQ) → .NET služby → Next.js.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"
SRC="$ROOT/src"
WEB="$ROOT/web"

MODE="foreground"
SKIP_DOCKER=0
SKIP_BUILD=0
NO_STOP=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

  Spustí Docker infra, všetky .NET mikroslužby, gateway a frontend.

Options:
  --foreground, -f   nechaj skript bežať; Ctrl+C zastaví všetko (default)
  --detach, -d       spusti na pozadí a ukonči skript
  --skip-docker      nespúšťaj docker compose
  --skip-build       nespúšťaj dotnet build (použi existujúci build)
  --no-stop          pred štartom nezastavuj bežiace procesy
  -h, --help         táto nápoveda

Stop:  $ROOT/scripts/stop-all.sh
Logs:  $LOG_DIR/
EOF
}

for arg in "$@"; do
  case "$arg" in
    --foreground|-f) MODE="foreground" ;;
    --detach|-d) MODE="detach" ;;
    --skip-docker) SKIP_DOCKER=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --no-stop) NO_STOP=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Neznámy argument: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

mkdir -p "$LOG_DIR" "$PID_DIR"
PIDS=()

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Chýba príkaz: $1" >&2
    exit 1
  fi
}

need_cmd dotnet
need_cmd npm
need_cmd curl

cleanup() {
  echo
  echo "==> Zastavujem procesy..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

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
  echo "==> Hotovo."
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
  local project_dir="$SRC/$(dirname "$project")"

  echo "  · $name  →  $url"
  : >"$logfile"

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
  else
    (
      cd "$project_dir"
      ASPNETCORE_ENVIRONMENT=Development \
      ASPNETCORE_URLS="$url" \
      DOTNET_ENVIRONMENT=Development \
        dotnet run --project "$SRC/$project" --no-build --no-launch-profile \
        >"$logfile" 2>&1
    ) &
    echo $! >"$pidfile"
  fi

  local pid
  pid="$(cat "$pidfile")"
  PIDS+=("$pid")
}

start_frontend() {
  local logfile="$LOG_DIR/web.log"
  local pidfile="$PID_DIR/web.pid"

  if [[ ! -d "$WEB/node_modules" ]]; then
    echo "  · web  →  npm install..."
    (cd "$WEB" && npm install) >"$LOG_DIR/web-install.log" 2>&1
  fi

  echo "  · web  →  http://localhost:3000"
  : >"$logfile"

  if [[ "$MODE" == "detach" ]]; then
    nohup bash -lc "cd \"$WEB\" && npm run dev -- --hostname 127.0.0.1 --port 3000" \
      >"$logfile" 2>&1 &
    echo $! >"$pidfile"
  else
    (
      cd "$WEB"
      npm run dev -- --hostname 127.0.0.1 --port 3000 >"$logfile" 2>&1
    ) &
    echo $! >"$pidfile"
  fi

  local pid
  pid="$(cat "$pidfile")"
  PIDS+=("$pid")
}

wait_http() {
  local name="$1"
  local url="$2"
  local attempts="${3:-60}"

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      echo "  ✓ $name ready"
      return 0
    fi
    sleep 0.5
  done

  echo "  ! $name ešte nie je ready (log: $LOG_DIR/${name}.log)"
  return 0
}

echo "==> SPST Knižnica – štart celého projektu ($MODE)"
echo "    root: $ROOT"
echo

if [[ "$NO_STOP" -eq 0 ]]; then
  echo "==> Uvoľňujem porty / stop predchádzajúceho behu"
  bash "$ROOT/scripts/stop-all.sh"
  echo
fi

if [[ "$SKIP_DOCKER" -eq 0 ]]; then
  if command -v docker >/dev/null 2>&1; then
    echo "==> Docker Compose (Redis / Kafka / RabbitMQ)"
    if docker info >/dev/null 2>&1; then
      if ! (cd "$ROOT" && docker compose up -d); then
        echo "  ! docker compose zlyhalo – pokračujem bez infra"
        echo "    Development appsettings majú Kafka/Cache/RabbitMQ vypnuté."
      fi
    else
      echo "  ! Docker daemon nebeží – infra sa preskakuje"
    fi
  else
    echo "==> Docker nie je nainštalovaný – infra sa preskakuje"
  fi
  echo
else
  echo "==> Docker vynechaný (--skip-docker)"
  echo
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Build .NET solution"
  (
    cd "$SRC"
    dotnet build SpstKniznica.sln -c Debug --nologo -v q
  )
  echo
else
  echo "==> Build vynechaný (--skip-build)"
  echo
fi

echo "==> .NET služby"
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

echo "==> Čakám na health endpointy"
wait_http "author"    "http://127.0.0.1:5207/health"
wait_http "category"  "http://127.0.0.1:5204/health"
wait_http "book"      "http://127.0.0.1:5203/health"
wait_http "booking"   "http://127.0.0.1:5208/health"
wait_http "workers"   "http://127.0.0.1:5209/health"
wait_http "messaging" "http://127.0.0.1:5205/health"
wait_http "cache"     "http://127.0.0.1:5206/health"
wait_http "auth"      "http://127.0.0.1:5210/health"
wait_http "admin"     "http://127.0.0.1:5211/health"
wait_http "gateway"   "http://127.0.0.1:5200/health" 80
wait_http "web"       "http://127.0.0.1:3000" 80
echo

cat <<EOF
==> Stack beží

  Frontend     http://localhost:3000
  Gateway      http://localhost:5200/swagger
  Auth         http://localhost:5210/swagger
  Admin        http://localhost:5211/swagger
  Booking      http://localhost:5208/swagger

  Logy         $LOG_DIR
  Stop         ./scripts/stop-all.sh
               alebo: ./stop.sh
EOF

if [[ "$MODE" == "foreground" ]]; then
  echo
  echo "  Beží v popredí – Ctrl+C zastaví všetko."
  echo "  (Na pozadí: ./start.sh --detach)"
  wait
else
  echo
  echo "  Detached mód – skript končí, služby bežia na pozadí."
  echo "  Stop: ./scripts/stop-all.sh"
fi
