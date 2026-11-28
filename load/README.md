# Záťažové testy (k6)

Scenáre sú v **TypeScript** (`load/k6/*.ts`) — k6 ≥ 0.57 ich spúšťa natívne (esbuild type-strip).  
Cez **Gateway** `http://127.0.0.1:5200` (rovnaká cesta ako frontend).  
Spoločná logika: `load/k6/lib/` (`config`, `http`, `catalog`, `ops`).  
Editor typy: `cd load && npm install` (`@types/k6` + `tsconfig.json`).

## Predpoklady

- [k6](https://k6.io/) ≥ 0.57 — `brew install k6` (projekt overený na k6 v2.x)
- Bežiaci stack: `./start.sh --detach`
- **Prod-like limity (429 / Redis):** `./start.sh --detach --loadtest` — načíta `appsettings.LoadTest.json` (rate limiting + Redis cache). Bežný Development limity prakticky vypína.

## Scenáre

| Príkaz | Čo meria |
| --- | --- |
| `./scripts/load-test.sh try` | Krátky beh cez Next + BFF (~45 s) |
| `./scripts/load-test.sh` / `smoke` | Sanity: batch health + katalóg (~30 s) |
| `./scripts/load-test.sh catalog` | Ramping browse + summaries/detail (~3 min) |
| `./scripts/load-test.sh authors` | Authors page / cursor / detail |
| `./scripts/load-test.sh categories` | Categories list + detail |
| `./scripts/load-test.sh search` | Arrival-rate `?search=` books/authors/categories |
| `./scripts/load-test.sh summaries` | Hot path `POST /api/books/summaries` |
| `./scripts/load-test.sh health` | `/health`, `/health/ready`, `/metrics?format=prom` |
| `./scripts/load-test.sh rate-limit` | Burst ~80 RPS (očakáva 429 pri `--loadtest`) |
| `./scripts/load-test.sh breakpoint` | Climbing arrival-rate → odhad max RPS |
| `./scripts/load-test.sh chaos-read` | Edge cases + 404 + náhodný browse |
| `./scripts/load-test.sh stress` | Arrival-rate až ~150 RPS |
| `./scripts/load-test.sh spike` | Burst 120 RPS a návrat |
| `./scripts/load-test.sh soak` | Dlhší mierny beh (default 10 min) |
| `./scripts/load-test.sh authenticated` | Výpožičky + desk/export/emails/orders |
| `./scripts/load-test.sh desk` | Desk daily + waitlist + summaries |
| `./scripts/load-test.sh favorites` | `/favorites`, waitlist/mine, `/auth/me` |
| `./scripts/load-test.sh web` | Next.js stránky + BFF allow/deny |
| `./scripts/load-test.sh bff` | BFF allowlist vs gateway + deny internal |
| `./scripts/load-test.sh seo` | sitemap / robots / llms / overview / seo-discovery |
| `./scripts/load-test.sh mixed` | Katalóg + health (+ auth ak je TOKEN) |

```bash
./scripts/load-test.sh catalog
./scripts/load-test.sh search
./scripts/load-test.sh authors
PROFILE=stress ./scripts/load-test.sh stress
SOAK_MINUTES=30 ./scripts/load-test.sh soak
TOKEN=… ./scripts/load-test.sh desk
TOKEN=… ./scripts/load-test.sh favorites
./start.sh --detach --loadtest && ./scripts/load-test.sh rate-limit
```

## PROFILE / prahy

| `PROFILE` | fail rate | p95 |
| --- | --- | --- |
| `smoke` | `< 2 %` | `< 600 ms` |
| `load` (default) | `< 2 %` | `< 800 ms` |
| `stress` | `< 5 %` | `< 1.5 s` |

Named thresholds (príklady): `books_summaries` p95 `< 400–500 ms`, `desk_daily` p95 `< 900 ms`, `books_search` p95 `< 900 ms`.

## Authenticated / desk / favorites

1. **JWT** — `TOKEN=<access_token> ./scripts/load-test.sh authenticated`
2. **DevelopmentAuth** — `Entra:Enabled=false` + `SPST_DEV_ADMIN=1` (TOKEN môže byť prázdny)

## Optimalizácie v skriptoch

- `http.batch` warm-up (`warmCatalogBatch`)
- vážený `browseCatalog` / `browseSearch` / `browseAuthors` / `browseCategories`
- spoločné `authHeaders` + tagged requests (lepšie grafy v k6)
- `think()` podľa PROFILE (kratší sleep pri stress/smoke)
- BFF scenár overí deny na `api/internal/*`
- chaos-read zámerné 404 / bad GUID / edge pageSize

## Rate limiting

V Development sú limity prakticky vypnuté.  
Pre prod-like beh:

```bash
./start.sh --detach --loadtest
./scripts/load-test.sh stress
./scripts/load-test.sh rate-limit
```

Školský NAT (jedna verejná IP): Production gateway má vyššie `PublicReadPermitLimit` (2400/min).  
Za reverse proxy nastav `ForwardedHeaders:KnownProxies` + `RateLimiting:TrustForwardedFor=true` a `RateLimiting:KnownProxies` na IP proxy, potom môžeš limity znížiť.
