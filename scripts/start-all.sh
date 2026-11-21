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
SKIP_STORYBOOK=0
NO_STOP=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

  Spustí Docker infra (compose up -d), všetky .NET mikroslužby, gateway, frontend a Storybook.

  Pred .NET vždy: docker compose up -d + wait na redis/kafka/rabbitmq.

Options:
  --foreground, -f   nechaj skript bežať; Ctrl+C zastaví všetko (default)
  --detach, -d       spusti na pozadí a ukonči skript
  --skip-docker      nespúšťaj docker compose up -d
  --skip-build       nespúšťaj dotnet build (použi existujúci build)
  --skip-storybook   nespúšťaj Storybook (port 6006)
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
    --skip-storybook) SKIP_STORYBOOK=1 ;;
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

# Root .env → ASP.NET (__ keys) + Docker Compose + NEXT_PUBLIC_* pre web.
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  echo "==> Načítané $ROOT/.env"
elif [[ -f "$ROOT/.env.example" ]]; then
  echo "==> Tip: skopíruj .env.example → .env (lokálne overrides)"
fi

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

ensure_web_deps() {
  if [[ ! -d "$WEB/node_modules" ]]; then
    echo "  · web  →  npm install..."
    (cd "$WEB" && npm install) >"$LOG_DIR/web-install.log" 2>&1
  fi
}

start_frontend() {
  local logfile="$LOG_DIR/web.log"
  local pidfile="$PID_DIR/web.pid"

  ensure_web_deps

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

start_storybook() {
  local logfile="$LOG_DIR/storybook.log"
  local pidfile="$PID_DIR/storybook.pid"

  ensure_web_deps

  echo "  · storybook  →  http://localhost:6006"
  : >"$logfile"

  if [[ "$MODE" == "detach" ]]; then
    nohup bash -lc "cd \"$WEB\" && npm run storybook -- --host 127.0.0.1 --port 6006 --ci --no-open" \
      >"$logfile" 2>&1 &
    echo $! >"$pidfile"
  else
    (
      cd "$WEB"
      npm run storybook -- --host 127.0.0.1 --port 6006 --ci --no-open >"$logfile" 2>&1
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
  local required="${4:-0}"

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      echo "  ✓ $name ready"
      return 0
    fi
    sleep 0.5
  done

  echo "  ! $name ešte nie je ready (log: $LOG_DIR/${name}.log)"
  if [[ "$required" -eq 1 ]]; then
    return 1
  fi
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

wait_docker_healthy() {
  local service="$1"
  local attempts="${2:-60}"
  local i status

  for ((i = 1; i <= attempts; i++)); do
    status="$(
      cd "$ROOT" && docker compose ps --format '{{.Service}} {{.Health}}' 2>/dev/null \
        | awk -v s="$service" '$1 == s { print $2; exit }'
    )"
    if [[ "$status" == "healthy" ]]; then
      echo "  ✓ $service healthy"
      return 0
    fi
    # Services without a healthcheck report empty / starting — treat "running" as OK.
    if [[ -z "$status" || "$status" == "none" ]]; then
      local state
      state="$(
        cd "$ROOT" && docker compose ps --format '{{.Service}} {{.State}}' 2>/dev/null \
          | awk -v s="$service" '$1 == s { print $2; exit }'
      )"
      if [[ "$state" == "running" ]]; then
        echo "  ✓ $service running"
        return 0
      fi
    fi
    sleep 1
  done

  echo "  ! $service ešte nie je ready (status=${status:-unknown})"
  return 1
}

if [[ "$SKIP_DOCKER" -eq 0 ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "==> Docker nie je nainštalovaný – infra sa preskakuje"
    echo "    Bez Redis/Kafka/RabbitMQ služby bežia, messaging/cache majú degradáciu."
    echo
  elif ! docker info >/dev/null 2>&1; then
    echo "==> Docker daemon nebeží – infra sa preskakuje"
    echo "    Spusti Docker Desktop a znova ./start.sh, alebo použij --skip-docker."
    echo
  else
    echo "==> Docker Compose up -d (Redis / Kafka / RabbitMQ)"
    if (cd "$ROOT" && docker compose up -d); then
      echo "  · čakám na healthchecky..."
      DOCKER_FAILED=0
      wait_docker_healthy "redis" 40 || DOCKER_FAILED=1
      wait_docker_healthy "rabbitmq" 60 || DOCKER_FAILED=1
      wait_docker_healthy "kafka" 90 || DOCKER_FAILED=1
      if [[ "$DOCKER_FAILED" -ne 0 ]]; then
        echo "  ! Niektoré kontajnery ešte nie sú healthy – pokračujem (log: docker compose ps)"
      else
        echo "  ✓ Infra ready"
      fi
    else
      echo "  ! docker compose up -d zlyhalo – pokračujem bez infra"
      echo "    Skontroluj: cd \"$ROOT\" && docker compose ps"
    fi
    echo
  fi
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
start_dotnet "email"      "EmailService/EmailService.csproj"           "http://127.0.0.1:5212"
start_dotnet "gateway"    "GatewayService/GatewayService.csproj"       "http://127.0.0.1:5200"
echo

echo "==> Frontend"
start_frontend
if [[ "$SKIP_STORYBOOK" -eq 0 ]]; then
  start_storybook
else
  echo "  · storybook  →  vynechaný (--skip-storybook)"
fi
echo

echo "==> Čakám na health endpointy"
FAILED=0
wait_http "author"    "http://127.0.0.1:5207/health" || true
wait_http "category"  "http://127.0.0.1:5204/health" || true
wait_http "book"      "http://127.0.0.1:5203/health" 80 1 || FAILED=1
wait_http "booking"   "http://127.0.0.1:5208/health" 80 1 || FAILED=1
wait_http "workers"   "http://127.0.0.1:5209/health" || true
wait_http "messaging" "http://127.0.0.1:5205/health" || true
wait_http "cache"     "http://127.0.0.1:5206/health" || true
wait_http "auth"      "http://127.0.0.1:5210/health" 80 1 || FAILED=1
wait_http "admin"     "http://127.0.0.1:5211/health" || true
wait_http "email"     "http://127.0.0.1:5212/health" || true
wait_http "gateway"   "http://127.0.0.1:5200/health" 100 1 || FAILED=1
# Ready = gateway + book + booking probes (stricter than /health liveness).
wait_http "gateway-ready" "http://127.0.0.1:5200/health/ready" 40 1 || FAILED=1
wait_http "web"       "http://127.0.0.1:3000" 100 1 || FAILED=1
if [[ "$SKIP_STORYBOOK" -eq 0 ]]; then
  # Storybook nie je kritický pre stack — len informatívny wait.
  wait_http "storybook" "http://127.0.0.1:6006" 120 || true
fi
echo

if [[ "$FAILED" -ne 0 ]]; then
  cat <<EOF
==> Stack NIE JE pripravený

  Kritické služby (book / booking / auth / gateway[/ready] / web) neodpovedajú.
  Skontroluj logy: $LOG_DIR
  Stop:           ./scripts/stop-all.sh

EOF
  if [[ "$MODE" == "detach" ]]; then
    exit 1
  fi
  echo "  Foreground mód – procesy nechávam bežať na debug (Ctrl+C zastaví)."
  wait
  exit 1
fi

STORYBOOK_LINE=""
if [[ "$SKIP_STORYBOOK" -eq 0 ]]; then
  STORYBOOK_LINE="  Storybook    http://localhost:6006"
fi

cat <<EOF
==> Stack beží

  Frontend     http://localhost:3000
${STORYBOOK_LINE}
  Gateway      http://localhost:5200/swagger
  Auth         http://localhost:5210/swagger
  Admin        http://localhost:5211/swagger
  Email        http://localhost:5212/swagger
  Booking      http://localhost:5208/swagger
  Ready        http://localhost:5200/health/ready

  Infra        Redis :6379 · Kafka :9092 · RabbitMQ :5672
  Rabbit UI    http://127.0.0.1:15672  (guest/guest)

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
