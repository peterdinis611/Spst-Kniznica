# SPŠT knižnica

Školský fond učebníc, noriem a literatúry pre SPŠT. SvelteKit aplikácia: katalóg, výpožičky, čitateľský účet a pult správy.

Fond sídli v pavilóne B. Výpožička je bez poplatku — **7, 14 alebo 21 dní**, strop na počet kníh nie je.

## Ako to vyzerá

Vstupná sieň je polica. Výpožička je lístok. Účet je preukaz.

![Vstupná sieň — police fondu](docs/screenshots/sien.png)

| Pracovné zväzky | Register kníh |
| :---: | :---: |
| ![Otočná polica zväzkov](docs/screenshots/police.png) | ![Riadky katalógu s voľnými výtlačkami](docs/screenshots/katalog.png) |

| Čitateľský preukaz | Výpožičný lístok |
| :---: | :---: |
| ![Prihlásenie ako preukaz](docs/screenshots/preukaz.png) | ![Lístok s menom, triedou a dobou](docs/screenshots/listok.png) |

![Kartotéka pultu](docs/screenshots/pult.png)

## Stack

- **SvelteKit 2** + Svelte 5, Vite, Tailwind CSS 4
- **PostgreSQL 16** (Docker) + **Drizzle ORM** (`postgres` klient)
- **Supabase Auth** — registrácia, prihlásenie, obnova hesla
- **Bun** — inštalácia a skripty (`bun.lock`)

Interná príručka je na [`/docs`](http://localhost:5173/docs).

## Lokálne spustenie

Potrebuješ **Bun**, **Docker** a kópiu `.env`.

```sh
bun install
cp .env.example .env
bun run db:up
bun run db:migrate
bun run dev
```

Aplikácia beží na [http://localhost:5173](http://localhost:5173). Katalóg sa **naseeduje pri prvom requeste**.

Predvolené `DATABASE_URL` je `postgres://spst:spst@localhost:5432/spst` (užívateľ / heslo / databáza `spst`). Zvyšok kľúčov je v `.env.example`.

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

Pult (`/admin`, alias `/pult`): `ADMIN_EMAILS` — čiarkou oddelené adresy, ktoré sa pri prihlásení stanú knihovníkom. Ďalších (aj učiteľov) pridelíš v zásuvke Čitatelia. V `vite dev` môže pult otvoriť aj bežný čitateľ.

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
bun run dev          # vývoj, port 5173
bun run build        # produkčný build
bun run preview      # náhľad buildu, port 4173
bun run check        # svelte-check
bun run test         # Vitest (jednorazovo)
bun run lint         # Prettier + ESLint
bun run storybook    # Storybook, port 6006
```

## Záťaž (k6)

Meria čítanie katalógu, nie prihlásenie ani výpožičky. Fond musí bežať skôr (dev 5173 alebo preview 4173). Obraz `grafana/k6:2.2.0`.

```sh
bun run k6:up
bun run k6:smoke     # 1 čitateľ
bun run k6:load      # 16 čitateľov
bun run k6:stress    # rampa; register meraj na preview + SEED_VOLUME=2500
bun run k6:down
```

Grafana: [http://localhost:3030](http://localhost:3030) (`pult` / `pavilonb`). Podrobnosti v [príručke záťaže](src/content/docs/zataz.svx).
