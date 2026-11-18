# Záťažové testy (k6)

Scenáre idú cez **Gateway** `http://127.0.0.1:5200` (rovnaká cesta ako frontend).

## Predpoklady

- [k6](https://k6.io/) — `brew install k6`
- Bežiaci stack: `./start.sh --detach` (+ `./scripts/ci-gateway-smoke.sh`)

## Scenáre

| Príkaz | Čo meria |
| --- | --- |
| `./scripts/load-test.sh` / `smoke` | Sanity: health + katalóg (~30 s, 1 VU) |
| `./scripts/load-test.sh catalog` | Ramping browse kníh/autorov/kategórií (~3 min) |
| `./scripts/load-test.sh stress` | Arrival-rate stress až ~150 RPS |
| `./scripts/load-test.sh authenticated` | Výpožičky + export (vyžaduje auth) |
| `./scripts/load-test.sh web` | Next.js stránky na `:3000` |

```bash
./scripts/load-test.sh catalog
BASE_URL=http://127.0.0.1:5200 ./scripts/load-test.sh stress
```

## Authenticated scenár

Gateway má Entra zapnuté aj v Development. Bez JWT padnú `/api/bookings` a export na 401.

Možnosti:

1. **JWT** — `TOKEN=<access_token> ./scripts/load-test.sh authenticated`
2. **DevelopmentAuth** — dočasne `Entra:Enabled: false` na gateway + službách a reštart so `SPST_DEV_ADMIN=1` (staff/admin principal bez tokenu)

## Rate limiting

V Development sú limity prakticky vypnuté (`EnableGlobalLimiter: false`, high caps).  
Pre prod-like beh použi Production `RateLimiting` + Redis a sleduj 429.

## Prahy (thresholds)

- smoke / catalog: `p(95) < 800 ms`, fail rate `< 2 %`
- stress: `p(95) < 1.5 s`, fail rate `< 5 %`

Úprava: `load/k6/lib/config.js`.
