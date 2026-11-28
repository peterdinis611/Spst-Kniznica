# Architecture — SPST Knižnica

Školský knižničný stack: **Next.js BFF** + **YARP gateway** nad **.NET 10** mikroslužbami.  
Lokálne SQLite; Production PostgreSQL (DB-per-service). Infra v Docker Compose (Redis, Kafka, RabbitMQ, Postgres).

Tento dokument je mapa systému. Pre UI/tokeny pozri [`design.md`](./design.md). Pre quickstart pozri root [`README.md`](../README.md).

---

## Context diagram

```text
┌─────────────┐     cookie BFF      ┌──────────────┐     YARP      ┌────────────────────┐
│  Browser    │ ──────────────────► │  Next.js     │ ────────────► │  GatewayService    │
│  (MSAL)     │   /api/bff/*        │  :3000       │  :5200        │  reverse-proxy.json│
└─────────────┘                     └──────────────┘               └─────────┬──────────┘
                                                                             │
                    ┌────────────────┬────────────────┬──────────────────────┼──────────┐
                    ▼                ▼                ▼                      ▼          ▼
              Book :5203      Author :5207    Category :5204         Booking :5208   Auth :5210
                    │                                                    │
                    │              ┌─────────────────────────────────────┤
                    │              ▼                                     ▼
                    │        Workers :5209                         Email :5212
                    │        (lifecycle / queue)                   Admin :5211
                    │
              Messaging :5205 · Cache :5206

Infra (compose): Postgres :5432 · Redis :6379 · Kafka :9092 · RabbitMQ :5672
Obs (profile):   Prometheus :9090 · Grafana :3001
```

Aplikácie bežia na hoste (`./start.sh`). Compose drží len infra (+ voliteľný monitoring).

---

## Repos layout

| Path | Role |
|------|------|
| `web/` | Next 16 App Router, BFF, react-admin, Storybook, react-email zdroje |
| `src/` | `SpstKniznica.sln` — služby + `SpstKniznica.Common` / `.Caching` + `tests/` |
| `scripts/` | start/stop/status, backups, CI smoke, secrets/overlays gates |
| `deploy/` | Postgres init, observability (Prometheus/Grafana) |
| `load/` | k6 scenáre |
| `docker-compose.yml` | Infra only |
| `.github/workflows/ci.yml` | CI gates |

---

## Services

| Service | Port | Responsibility |
|---------|------|----------------|
| GatewayService | 5200 | YARP, CORS, rate limit, `/health` · `/health/ready` · `/metrics` |
| BookService | 5203 | Knihy, exempláre, import/export, ISBN |
| CategoryService | 5204 | Kategórie |
| MessagingService | 5205 | Kafka/Rabbit bridge, book↔category väzby |
| CacheService | 5206 | Redis admin API |
| AuthorService | 5207 | Autori (+ enrich) |
| BookingService | 5208 | Výpožičky, waitlist, favorites, policy, outbox → Email/Book |
| WorkersService | 5209 | Order queue + loan lifecycle (overdue / due-reminders) |
| AuthService | 5210 | Entra profil / session pre FE |
| AdminService | 5211 | Audit log store (InternalApi ingest) |
| EmailService | 5212 | SMTP / log-only; HTML šablóny výpožičiek |

Shared:

- `SpstKniznica.Common` — Entra, InternalApi, audit outbox, rate limiting, metrics, messaging HMAC, DB helpers  
- `SpstKniznica.Caching` — Redis  

Routing: `src/GatewayService/reverse-proxy.json` (mutácie katalógu Staff-gated).

---

## Frontend (Next.js)

- **Routes:** `(catalog)/` (books, authors, categories, bookings, desk), `/admin`, `/login`, status pages  
- **BFF:** `web/app/api/bff/[...path]` → gateway; allowlist; **blokuje** `api/internal`  
- **Auth cookie:** `spst_at` HttpOnly; BFF pridá `Authorization: Bearer`  
- **AuthZ:** CASL + Entra role (Admin / Librarian)  
- **Admin:** react-admin + tool stránky (emails, cache, messaging)  
- **Emails:** `web/emails/` → `npm run emails:build` → `src/EmailService/Templates/`

---

## Data & messaging

| Concern | Fact |
|---------|------|
| SQLite | Default Development; `*.db` per service |
| PostgreSQL | Production `Database:Provider=PostgreSql`; DBs `spst_book`, `spst_booking`, `spst_author`, `spst_category`, `spst_email`, `spst_admin`, `spst_auth`, `spst_messaging` |
| Redis | Cache, rate limits (prod), audit outbox list, Workers queue |
| Kafka / RabbitMQ | Topic/exchange `spst.library.events`; optional HMAC signing |
| Integration outbox | Booking `OutboxMessages` + dispatcher → brokers |
| Audit outbox | Redis preferred; file JSONL fallback → AdminService |
| Prod posture | Fail-closed Redis/Postgres/SslMode; `Metrics:RequireKey`; template-key for raw email |

SQLite-era EF migrácie na Npgsql: Guid/DateTimeOffset/bool store types cez `SqliteLegacyStoreTypes` + Guid TEXT converters.

---

## Auth & trust boundaries

```text
Public browser ──► Next (cookie) ──► BFF ──► Gateway (JWT / Dev handler)
Service ──► Service: X-Internal-Api-Key (InternalApi:SharedKey)
Staff mutations: Entra roles / Staff policy on gateway & services
```

- Development: `Entra:Enabled=false` → DevelopmentAuthHandler (nie v Production)  
- Metrics: `/metrics?format=prom`; v prod `X-Metrics-Key` / InternalApi key  

---

## Key flows

### Catalog read

FE → BFF (alebo direct gateway GET) → YARP → Book / Author / Category.  
Offset + cursor pagination; Redis cache na službách.

### Checkout / return

Staff desk → `POST /api/bookings/{id}/checkout|return|renew|cancel`.  
Booking overí exemplár cez Book internal API; return môže promote-núť waitlist; e-mail šablóny `loan-borrowed` / `loan-returned`; eventy do outboxu.

### Waitlist

`POST /api/bookings/waitlist`; promote pri return alebo `…/waitlist/book/{id}/promote` → Reserved + `waitlist-promotion` e-mail.

### Due reminders

Workers (~300s) → `POST /api/internal/bookings/mark-overdue` + `due-reminders` → Email `loan-due-reminder` + event.

### Email dispatch

Booking `HttpLoanNotificationSender` → `api/internal/emails/templates/*` (fail-open).  
EmailService: plain text + trusted HTML z `Templates/` (react-email). SMTP alebo log-only.

---

## Observability

- Per-service `/health`; Gateway `/health/ready` (core: Book + Booking)  
- `/metrics` JSON alebo Prometheus text (`spst_*`)  
- `docker compose --profile observability up -d` → Grafana `:3001`, Prometheus `:9090`  
- Docs: [`deploy/observability/README.md`](../deploy/observability/README.md)

---

## CI

| Job | Gate |
|-----|------|
| hardening | Production overlays + secrets script |
| backend | .NET restore / build / test |
| frontend | typecheck, lint, vitest |
| e2e | Playwright Next-only smoke |
| stack-smoke | Book + Booking + Gateway + Redis + Postgres |
| gateway-api-smoke / load-smoke | `workflow_dispatch` |

---

## Ops scripts (index)

| Script | Use |
|--------|-----|
| `./start.sh` | Infra + .NET + Next (`--detach`, `--observability`, `--loadtest`) |
| `./scripts/status.sh` | Health snapshot |
| `./scripts/backup-sqlite.sh` / `pg-backup.sh` | Backups |
| `./scripts/sqlite-to-postgres.sh` | ETL |
| `./scripts/check-production-*.sh` | Prod gates |

---

## Invariants (do not break casually)

1. **BFF never proxies `api/internal`.**  
2. **Loan lifecycle must not fail on email/SMTP** (notifications are fail-open).  
3. **Production:** Postgres + Redis require + metrics key + email template key for raw send.  
4. **DB-per-service** — žiadny shared schema medzi Book a Booking.  
5. **react-email HTML** sa commituje do `EmailService/Templates/` po `npm run emails:build`.
