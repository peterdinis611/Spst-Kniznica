# Playwright E2E

Lightweight smoke tests against the Next.js app. They intentionally **do not** require Entra login.

## What is covered

- `/books` — catalog heading and search (when Book API responds)
- `/401`, `/404` — Slovak status copy

Full **reserve → checkout** flows need the whole stack (`./start.sh` or Docker + gateway on port 5200) and **DevAuth** / staff login — not exercised here.

## Run locally

```bash
cd web
npm install
npx playwright install chromium   # once per machine
```

Either let Playwright start Next (`npm run dev` via `playwright.config.ts`):

```bash
npm run test:e2e
```

Or run the app yourself and reuse the server:

```bash
# from repo root
./start.sh
# or: cd web && npm run dev

cd web
PLAYWRIGHT_NO_WEB_SERVER=1 npm run test:e2e
```

UI mode:

```bash
npm run test:e2e:ui
```

## CI

Set `CI=true` if you want a fresh dev server (no reuse). Skip starting the server entirely with `PLAYWRIGHT_NO_WEB_SERVER=1` when nothing listens on port 3000 — tests that need `/books` data may show the offline error page instead of the full catalog shell.