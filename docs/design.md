# Design — SPST Knižnica

Vizuálny a UX jazyk školského katalógu SPST Bardejov.  
Zdroj pravdy pre tokeny: `web/app/globals.css`. Architektúra: [`architecture.md`](./architecture.md).

---

## Direction

**Editorial school library** — papierový fond, typografická hierarchia, sage accent.  
Nie SaaS dashboard, nie purple gradient, nie „AI landing“.

| Axis | Choice |
|------|--------|
| Mood | Quiet, institutional, readable |
| Surfaces | Warm paper / deep ink (light ↔ dark) |
| Accent | Sage green (`#4d7356`), not yellow/purple |
| Radius | Near-sharp (`--radius: 0.15rem`) |
| Motion | Staggered page reveals; restrained hover |
| Audience | Žiaci + učitelia + knihovník pri pulte |

**Unforgettable detail:** masthead „SPST Knižnica“ ako brand-level signal (nie len nav label) + papierová atmosféra (grain / watermark).

---

## Brand & type

| Role | Face | Use |
|------|------|-----|
| Display | **Fraunces** | Nadpisy, hero, knižné tituly |
| Body | **Sora** | UI copy, formuláre, odstavce |
| Mono | **IBM Plex Mono** | IDs, status, admin tools, metriky |

Fonty: `web/app/layout.tsx` (`next/font/google`).  
CSS aliases: `--font-display-family`, `--font-body-family`, `--font-mono-family`.

Copy default: **slovenčina** (status pages, e-maily, admin tools).

---

## Color tokens (light)

| Token | Value | Role |
|-------|-------|------|
| `--ink` | `#0e1a24` | Text / primary |
| `--paper` | `#f7f3ea` | Page background |
| `--paper-deep` | `#efe8dc` | Secondary surface |
| `--rule` | `#d9d0c2` | Borders / dividers |
| `--muted-text` | `#5a656f` | Secondary copy |
| `--accent-brand` / `--accent` | `#4d7356` | CTA, focus, sage |
| `--accent-soft` / `--mint` | `#d8e8d4` | Soft chips / highlights |
| `--sage` | `#5f7d5b` | Eyebrows, rings |
| `--stair-*` | warm → magenta → violet | Decorative stair / charts only |

Dark mode inverts paper/ink and lifts sage (`globals.css` `.dark`).  
Prefer Tailwind semantic classes: `bg-paper`, `text-ink`, `border-rule`, `bg-accent`, `text-muted-foreground`.

---

## Layout principles

1. **One composition per first viewport** on public pages — brand, headline, short support, CTA; nie dashboard clutter.  
2. **Brand first** — produktové meno nesmie byť len drobný nav text.  
3. **Cards sparingly** — len keď frame nesie interakciu; inak typografia + rule.  
4. **One job per section** — jeden headline, jedna krátka veta.  
5. **Asymmetry OK** — overlap / diagonal len keď podporí hierarchiu, nie dekorácia pre dekoráciu.  
6. **Admin (`/admin`)** — utilitárny react-admin; zachovaj sharp radius a mono pre IDs, ale nekopíruj marketing hero.

Status pages (`/401`, `/404`, `/429`, `/502`, `/503`): plný `HttpStatusPanel` so slovenským copy z `web/lib/routing/http-status.ts`.

---

## Motion

- Prefer CSS / Framer Motion už v projekte.  
- Page load: staggered reveal obsahu, nie scatter micro-bounces.  
- Hover: farba / underline / jemný translate — nie glow stack.  
- Reduced motion: rešpektuj `prefers-reduced-motion`.

---

## Components & patterns

| Pattern | Notes |
|---------|--------|
| Catalog | Search + filtre; virtualizácia (TanStack Virtual) pri dlhých zoznamoch |
| Desk / bookings | Operatívny pult — hustota OK; jasné stavy (Reserved / Active / Overdue) |
| Forms | Sharp inputs (`border-radius: 0` v admin tools); plain Slovak labels |
| Toasts | Krátke SK správy; 429 zostáva soft (toast), hard page existuje |
| Security UI | Žiadne HTML v user content; JSON-LD / e-maily cez escape |

shadcn + Base UI sú toolkit — **neprepíš brand tokeny** na default shadcn violet.

---

## E-mail design

Zdroj: `web/emails/` · layout `SpstEmailLayout`.

| | |
|--|--|
| Look | Editorial list: forest masthead, paper panel, terracotta left rule |
| Type | Georgia (display) + system sans (meta/CTA) — web-safe |
| CTA | Solid forest button → Moja knižnica / Katalóg |
| Safety | Len statické HTML; user polia ako `{{Token}}` → C# `HtmlEncode` |

Šablóny: požičanie, vrátenie, pripomienka, waitlist ready.  
Preview: `cd web && npm run emails:dev` · build: `npm run emails:build`.

Email farby sú **blízke** webu (papier / forest / accent), nie 1:1 CSS variables — e-mail klienti nevedia Tailwind.

---

## Observability UI (Grafana)

Lokálny dashboard „SPST Knižnica — overview“ — funkčný, nie brandovaný marketing.  
Grafana default theme OK; app brand žije vo webe a e-mailoch.

---

## Do / don’t

**Do**

- Fraunces + Sora + sage na papierovom pozadí  
- Slovenské status a e-mail copy  
- Ostré rohy, jemný grain/watermark  
- Light default; dark ako plnohodnotný twin  

**Don’t**

- Inter / Roboto / Space Grotesk ako display  
- Purple-on-white / indigo glow / rounded-full pill clutter  
- Inset hero karty namiesto full-bleed brand na marketing plochách  
- Emoji ako náhrada za typografiu  
- Voľný HTML od používateľa v e-mailoch alebo JSON-LD  

---

## File map

| File | What |
|------|------|
| `web/app/globals.css` | Tokens, theme, utilities |
| `web/app/layout.tsx` | Font loading |
| `web/components/routing/HttpStatusPanel.tsx` | Status UX |
| `web/emails/_components/SpstEmailLayout.tsx` | Mail chrome |
| `web/lib/og/theme.ts` | OG / social frame colors |
