# SPST Knižnica

Školský knižničný katalóg **Strednej priemyselnej školy technickej** v Bardejove — knihy, autori, kategórie, výpožičný pult a správcovský panel.

Dokumentácia: [`docs/architecture.md`](docs/architecture.md) · [`docs/design.md`](docs/design.md) · [`deploy/README.md`](deploy/README.md) (školský VPS)

## Stack

| Vrstva | Technológie |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind, react-admin, TanStack Virtual |
| API | ASP.NET Core (.NET 10), YARP gateway, mikroslužby |
| Dáta | SQLite (Development) · PostgreSQL v `appsettings.Production.json` · Redis · Kafka · RabbitMQ |
| Auth | Microsoft Entra ID (MSAL) · CASL oprávnenia |

## Štruktúra

```
├── web/                 # Next.js frontend (+ BFF proxy)
├── src/                 # .NET solution (mikroslužby + Common)
│   ├── GatewayService/
│   ├── BookService / AuthorService / CategoryService /
│   ├── BookingService / AuthService / AdminService / …
│   └── tests/
├── scripts/             # start-all / stop-all / status
├── docker-compose.yml   # Redis · Kafka · RabbitMQ (localhost)
├── start.sh / stop.sh
└── .github/workflows/ci.yml
```

## Požiadavky

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/) + npm
- Docker Desktop (voliteľné — Redis/Kafka/RabbitMQ; bez neho stack beží s vypnutými brokerami)

## Premenné prostredia

```bash
cp .env.example .env          # backend + Docker + FE (načíta ./start.sh)
cp web/.env.example web/.env  # keď bežíš Next samostatne (npm run dev)
```

ASP.NET mapuje nested config cez `__` (napr. `Entra__Enabled`, `InternalApi__SharedKey`, `Smtp__Host`).  
Frontend používa `NEXT_PUBLIC_*` (API URL, Entra override, Turnstile, adresa knižnice).

## Rýchly štart

```bash
./start.sh
```

Otvor [http://localhost:3000](http://localhost:3000) (app) a [http://localhost:6006](http://localhost:6006) (Storybook).

Zastavenie:

```bash
./stop.sh
```

Užitočné voľby:

```bash
./start.sh --detach         # na pozadí
./start.sh --skip-docker    # bez Docker Compose
./start.sh --skip-build     # bez dotnet build
./start.sh --skip-storybook # bez Storybook
./scripts/status.sh         # stav procesov
```

### Seed dát

Pri štarte služieb sa do **prázdnych** (alebo chýbajúcich) záznamov doplní seed:

- ~12 kategórií
- ~39 autorov
- ~54 kníh (+ exempláre)

Seed pridáva len chýbajúce GUID — netreba mazať DB pri rozšírení katalógu.

## Porty (lokálne)

| Služba | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Storybook | http://localhost:6006 |
| Gateway (YARP + Swagger) | http://localhost:5200 |
| BookService | http://localhost:5203 |
| CategoryService | http://localhost:5204 |
| MessagingService | http://localhost:5205 |
| CacheService | http://localhost:5206 |
| AuthorService | http://localhost:5207 |
| BookingService | http://localhost:5208 |
| WorkersService | http://localhost:5209 |
| AuthService | http://localhost:5210 |
| AdminService | http://localhost:5211 |
| Redis | `127.0.0.1:6379` |
| Kafka | `127.0.0.1:9092` |
| RabbitMQ UI | http://127.0.0.1:15672 (`guest` / `guest`) |

Health: `GET /health` na každej .NET službe.

## API stránkovanie

Offset (page):

```http
GET /api/books?page=1&pageSize=40
GET /api/authors?page=1&pageSize=40
GET /api/categories?page=1&pageSize=40
```

Cursor (keyset — infinite scroll):

```http
GET /api/books/cursor?limit=40&cursor=…
GET /api/authors/cursor?limit=40&cursor=…
GET /api/categories/cursor?limit=40&cursor=…
```

Odpoveď cursoru: `{ items, nextCursor, hasMore, limit }`.

## Správa

- Verejný katalóg: `/books`, `/authors`, `/categories`
- Výpožičný pult: `/bookings`, denná tabuľa `/desk`
- Admin (personál): `/admin` — CRUD, import kníh, export, health, cache, messaging

Import kníh (CSV / XML / XLSX) a ISBN lookup (Open Library) vyžadujú rolu personálu / admina. Autori sa dajú obohatiť z Wikidata.

## Vývoj frontend

```bash
cd web
npm ci
npm run dev              # http://127.0.0.1:3000
npm run storybook        # http://127.0.0.1:6006
npm run typecheck
npm run lint
npm test
```

## Vývoj backend

```bash
cd src
dotnet build SpstKniznica.sln
dotnet test SpstKniznica.sln
```

Ak `dotnet build` hlási `FAILED` s **0 chýbami**, ide typicky o zamknuté DLL (bežiace služby) — najprv `./stop.sh`.

## Záťažové testy

k6 scenáre proti gateway (`load/`, vyžaduje `brew install k6` + bežiaci stack):

```bash
./start.sh --detach
./scripts/load-test.sh try      # Next + BFF (~45 s)
./scripts/load-test.sh catalog  # browse load
# Prod-like Redis limity (429):
./start.sh --detach --loadtest
./scripts/load-test.sh stress
```

Padnutá služba na jednom stroji: `./scripts/restart-unhealthy.sh`  
Detaily: [`load/README.md`](load/README.md).

### Prevádzka / hardening

```bash
./scripts/status.sh                      # health + disk + Redis
./scripts/backup-sqlite.sh               # online záloha *.db (WAL-safe)
./scripts/install-daily-backup.sh        # launchd/cron: denne 20:00 (+ retencia 14 dní)
./scripts/restore-sqlite.sh .backups/... # obnova (najprv stop-all)
./scripts/pg-backup.sh                   # pg_dump všetkých spst_* DB
./scripts/check-production-secrets.sh    # Entra / InternalApi / SITE_URL
```

PostgreSQL: Production už má `Database:Provider=PostgreSql`. Lokálne: `docker compose up -d postgres` → `.env` `Database__Provider=PostgreSql` → reštart.  
Detaily: [`deploy/postgres/README.md`](deploy/postgres/README.md).

E-mail šablóny (react-email): `cd web && npm run emails:dev` (preview) / `npm run emails:build` → `src/EmailService/Templates/`.  
Požičanie / vrátenie / pripomienka / waitlist posielajú HTML + plain text. Detaily: [`web/emails/README.md`](web/emails/README.md).

Gateway metriky: `GET /metrics` (JSON) alebo `GET /metrics?format=prom` (Prometheus text).  
Lokálny monitoring: `docker compose --profile observability up -d` → Grafana [http://127.0.0.1:3001](http://127.0.0.1:3001) (`admin`/`admin`) + Prometheus `:9090`.  
Detaily: [`deploy/observability/README.md`](deploy/observability/README.md).  
Outbox / audit backlog: Book/Booking/Workers `/health` (degraded pri dead-letter / veľkom backlogs).  
CORS pre priamy katalóg: nastav `SITE_URL` / `NEXT_PUBLIC_SITE_URL` / `Cors__SiteUrl` na verejnú URL školy.  
Redis down: `RateLimiting__AllowMemoryFallback=true` / `Cache__AllowMemoryFallback=true` (single-host only; Production fail-closed).  
Audit outbox + order jobs: Redis list (multi-host); file JSONL len ako fallback bez Redis.

## CI

GitHub Actions (`.github/workflows/ci.yml`) na `push` / PR:

- **Hardening** — Production overlay gate + secrets script (soft v Development)
- **Backend** — restore, build, test (.NET 10)
- **Frontend** — `npm ci`, typecheck, lint, vitest
- **E2E** — Playwright Next-only (bez gateway)
- **Stack smoke** — Book + Booking + Gateway + Redis + **Postgres**
- **Gateway API smoke** — `workflow_dispatch` s `gateway_url`
- **Load smoke (k6)** — `workflow_dispatch` s `run_load_smoke=true` + `gateway_url`

## Licencia / škola

Interný školský projekt SPST Bardejov (Komenského 5). Nie je určený na produkčné nasadenie bez hardeningu (Entra, Turnstile, secrets, HTTPS).
