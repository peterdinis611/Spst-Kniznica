# SPŠT knižnica

Školský fond učebníc, noriem a literatúry pre SPŠT. Next.js aplikácia: katalóg, výpožičky, čitateľský účet a pult správy.

Fond sídli v pavilóne B. Výpožička je bez poplatku — **7, 14 alebo 21 dní**, strop na počet kníh nie je.

## Ako to vyzerá

Vstupná sieň je polica. Výpožička je lístok. Účet je preukaz.

![Vstupná sieň — landing](docs/screenshots/landing.png)

| Police fondu | Pracovné zväzky |
| :---: | :---: |
| ![Chrbtové menovky na polici](docs/screenshots/sien.png) | ![Otočná polica zväzkov](docs/screenshots/police.png) |

| Register kníh | Dnes na pulte |
| :---: | :---: |
| ![Riadky katalógu s voľnými výtlačkami](docs/screenshots/katalog.png) | ![Odporúčaná kniha na pulte](docs/screenshots/objavovat.png) |

| Police odborov | Autori vo fonde |
| :---: | :---: |
| ![Odbory so zväzkami na polici](docs/screenshots/odbory.png) | ![Register autorov](docs/screenshots/autori.png) |

![Karta knihy s obálkou a signatúrou](docs/screenshots/kniha.png)

| Čitateľský preukaz | Nový preukaz |
| :---: | :---: |
| ![Prihlásenie ako preukaz](docs/screenshots/preukaz.png) | ![Registrácia nového čitateľa](docs/screenshots/novy.png) |

| Výpožičný lístok | Hľadanie vo fonde |
| :---: | :---: |
| ![Lístok s menom, triedou a dobou](docs/screenshots/listok.png) | ![Náhľad katalógu pri hľadaní](docs/screenshots/hladanie.png) |

| Kartotéka pultu | Záložky zásuviek |
| :---: | :---: |
| ![Kartotéka pultu](docs/screenshots/pult.png) | ![Záložky pultu — knihy, čitatelia, výkazy](docs/screenshots/kartoteka.png) |

| Register podľa odborov | Príručka fondu |
| :---: | :---: |
| ![Folio registra výtlačkov](docs/screenshots/register.png) | ![Príručka fondu](docs/screenshots/prirucka.png) |

| Porucha pultu | Karta mimo zásuvky |
| :---: | :---: |
| ![Zásuvka sa zasekla — 500](docs/screenshots/porucha.png) | ![Karta nie je v zásuvke — 404](docs/screenshots/chyba.png) |

## Stack

- **Next.js 15** (App Router) + React 19, Tailwind CSS 4
- **PostgreSQL 16** (Docker) + **Drizzle ORM** (`postgres` klient)
- **Supabase Auth** — registrácia, prihlásenie, obnova hesla
- **next-safe-action** + Valibot — server actions
- **Bun** — inštalácia a skripty (`bun.lock`)

Interná príručka je na [`/docs`](http://localhost:3000/docs).

## Štruktúra

```
src/
  app/           App Router (page.tsx, layout.tsx, route.ts)
  components/    UI — server komponenty + malé client ostrovy
  styles/        globálne CSS (téma, sieň, pult)
  server/        databáza, session, katalóg, pult, mail
  config/        env, runtime, supabase
  types/
  utils/
  auth/          role a polia prihlásenia
  desk/          polia pultu
  catalog/       obálky, search, hold
  middleware.ts
content/docs/    príručka (.svx → neskôr MDX)
```

Stránky sú React Server Components. Klient ide len tam, kde treba stav (hľadanie, téma, menu, formuláre).

## Lokálne spustenie

Potrebuješ **Bun**, **Docker Desktop** a kópiu `.env`.

```sh
bun install
cp .env.example .env
bun run db:up
bun run db:migrate
bun run dev
```

Aplikácia beží na [http://localhost:3000](http://localhost:3000). Katalóg sa **naseeduje pri prvom requeste**.

Predvolené `DATABASE_URL` je `postgres://spst:spst@localhost:5432/spst`. Ak máš na 5432 systémový Postgres, v `.env` daj `POSTGRES_PORT=5433` a rovnaký port v `DATABASE_URL`. Zvyšok kľúčov je v `.env.example`.

Bez bežiaceho Postgresu stránky spadnú na 500 (zásuvka sa zasekla). Docker Desktop musí byť zapnutý, kým ide `bun run db:up`.

### Databáza

| Príkaz | Čo robí |
| --- | --- |
| `bun run db:up` | Postgres 16 v Dockeri |
| `bun run db:migrate` | Drizzle migrácie z `drizzle/` |
| `bun run db:generate` | nová migrácia zo schémy |
| `bun run db:push` | schéma priamo do DB (bez súboru) |
| `bun run db:studio` | Drizzle Studio |
| `bun run db:down` | zastaví kontajner |

Veľkosť seedu riadi `SEED_VOLUME` (kanonický fond je 20 kníh; vyššie číslo je na stres registra). Po zmene reštartuj `bun run dev`.

## Čo treba v `.env`

Minimálne `DATABASE_URL`. Na prihlásenie:

- `PUBLIC_SUPABASE_URL` a `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- v Supabase Auth redirect `{ORIGIN}/auth/confirm`

Pult (`/admin`, alias `/pult`): `ADMIN_EMAILS` — čiarkou oddelené adresy, ktoré sa pri prihlásení stanú knihovníkom. Ďalších (aj učiteľov) pridelíš v zásuvke Čitatelia. V `next dev` môže pult otvoriť aj bežný čitateľ.

Ďalšie voliteľné:

- **UploadThing** (`UPLOADTHING_TOKEN`) — obálky kníh z pultu
- **Mail** — lokálne Mailtrap (`MAIL_DRIVER=mailtrap`), na ostrej Mailgun. Listy idú pri výpožičke, vrátení, predĺžení, čakacom lístku, termíne a zmene hesla. S `SUPABASE_SERVICE_ROLE_KEY` ide obnova hesla z pultu, nie z predvolenej pošty Supabase.
- **Tik pultu** (`DESK_TICK_SECRET`) — cron `GET /api/desk/tick` (Bearer alebo `?secret=`). Bez secretu → 403. Pri návšteve fondu beží tik aj sám, raz za 30 minút.
- **Rate limit** — prihlásenie, registrácia a obnova hesla. `RATE_LIMIT=off` vypne.

## Mapa

| Cesta | Čo tam je |
| --- | --- |
| `/` | vstupná sieň, rýchle hľadanie |
| `/discover` | dnes na pulte, police odborov |
| `/books`, `/holdings` | katalóg a register výtlačkov |
| `/departments`, `/authors` | odbory a autori |
| `/login` | prihlásenie / registrácia (`?mod=novy`) |
| `/loans`, `/profile` | lístok a preukaz (po prihlásení) |
| `/admin` | pult — čítačka, CRUD, trieda vonku, štítky, výkazy CSV/XML (knihovník; učiteľ len triedu) |
| `/docs` | príručka |

Slovenské aliasy (`/knihy`, `/pult`, `/profil`…) sa 308 presmerujú na kanonické cesty.

## Skripty

```sh
bun run dev          # vývoj, port 3000
bun run build        # produkčný build
bun run start        # Next start, port 3000
bun run test         # Vitest (jednorazovo)
bun run lint         # Prettier
bun run format       # Prettier write
```

## Záťaž (k6)

Meria čítanie katalógu, nie prihlásenie ani výpožičky. Fond musí bežať skôr (`bun run dev` na porte 3000). Obraz `grafana/k6:2.2.0`.

```sh
bun run k6:up
bun run k6:smoke     # 1 čitateľ
bun run k6:load      # 16 čitateľov
bun run k6:stress    # rampa; register meraj na `bun run start` + SEED_VOLUME=2500
bun run k6:down
```

Predvolené `BASE_URL` je `http://host.docker.internal:3000`. Grafana: [http://localhost:3030](http://localhost:3030) (`pult` / `pavilonb`). Podrobnosti v [príručke záťaže](content/docs/zataz.svx).
