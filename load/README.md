# Záťažové testy (k6)

Scenáre idú cez **Gateway** `http://127.0.0.1:5200` (rovnaká cesta ako frontend).  
Spoločná logika: `load/k6/lib/` (`config`, `http`, `catalog`, `ops`).

## Predpoklady

- [k6](https://k6.io/) — `brew install k6`
- Bežiaci stack: `./start.sh --detach` (+ `./scripts/ci-gateway-smoke.sh`)

## Scenáre

| Príkaz | Čo meria |
| --- | --- |
| `./scripts/load-test.sh try` | Krátky beh cez Next + BFF (~45 s) |
| `./scripts/load-test.sh` / `smoke` | Sanity: batch health + katalóg (~30 s) |
| `./scripts/load-test.sh catalog` | Ramping browse + summaries/detail (~3 min) |
| `./scripts/load-test.sh summaries` | Hot path `POST /api/books/summaries` |
| `./scripts/load-test.sh stress` | Arrival-rate až ~150 RPS |
| `./scripts/load-test.sh spike` | Burst 120 RPS a návrat |
| `./scripts/load-test.sh soak` | Dlhší mierny beh (default 10 min) |
| `./scripts/load-test.sh authenticated` | Výpožičky + desk/export/emails/orders |
| `./scripts/load-test.sh desk` | Desk daily + waitlist + summaries |
| `./scripts/load-test.sh web` | Next.js stránky + BFF allow/deny |
| `./scripts/load-test.sh mixed` | Katalóg + health (+ auth ak je TOKEN) |

```bash
./scripts/load-test.sh catalog
PROFILE=stress ./scripts/load-test.sh stress
SOAK_MINUTES=30 ./scripts/load-test.sh soak
TOKEN=… ./scripts/load-test.sh desk
```

## PROFILE / prahy

| `PROFILE` | fail rate | p95 |
| --- | --- | --- |
| `smoke` | `< 2 %` | `< 600 ms` |
| `load` (default) | `< 2 %` | `< 800 ms` |
| `stress` | `< 5 %` | `< 1.5 s` |

Named thresholds (príklady): `books_summaries` p95 `< 400–500 ms`, `desk_daily` p95 `< 900 ms`.

## Authenticated / desk

1. **JWT** — `TOKEN=<access_token> ./scripts/load-test.sh authenticated`
2. **DevelopmentAuth** — `Entra:Enabled=false` + `SPST_DEV_ADMIN=1` (TOKEN môže byť prázdny)

## Optimalizácie v skriptoch

- `http.batch` warm-up (`warmCatalogBatch`)
- vážený `browseCatalog` (page / cursor / detail / **summaries**)
- spoločné `authHeaders` + tagged requests (lepšie grafy v k6)
- `think()` podľa PROFILE (kratší sleep pri stress/smoke)
- BFF scenár overí deny na `api/internal/*`

## Rate limiting

V Development sú limity prakticky vypnuté.  
Pre prod-like beh použi Production `RateLimiting` + Redis a sleduj 429.
