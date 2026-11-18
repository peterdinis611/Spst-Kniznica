# Playwright E2E

Lightweight smoke tests against the Next.js app. They intentionally **do not** require Entra login.

## What is covered

- `/`, `/books`, `/authors`, `/categories`, `/bookings` — public chrome (or offline Slovak copy)
- Catalog URL filters (`?year=` / `?lang=`)
- `/401`, `/404`, `/429`, `/500` — Slovak status copy
- Optional gateway API (`/health`, `/api/books`, `/api/authors`, `/api/categories`, `/api/auth/config`, unauthorized export)
- Mobile Chrome project runs the smoke suite on a Pixel 7 viewport

## Gaps (documented)

CI runs **Next-only** smoke (Playwright starts `npm run dev`). It does **not** boot the .NET gateway or microservices. Catalog data may show the offline error page; gateway specs **skip** unless `PLAYWRIGHT_REQUIRE_GATEWAY=1`.

Full-stack checks locally:

```bash
./start.sh --detach
./scripts/ci-gateway-smoke.sh
cd web && PLAYWRIGHT_NO_WEB_SERVER=1 PLAYWRIGHT_REQUIRE_GATEWAY=1 npm run test:e2e
```

## Run locally

```bash
cd web
npm install
npx playwright install chromium   # once per machine
npm run test:e2e
```

UI mode:

```bash
npm run test:e2e:ui
```
