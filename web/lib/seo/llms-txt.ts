import { libraryFaqs } from "@/lib/content/faq";
import { absoluteUrl, siteConfig } from "@/lib/site";

/** Curated LLM-facing index ([llmstxt.org](https://llmstxt.org/) v2). */
export function buildLlmsTxt(): string {
  const home = absoluteUrl("/");
  const overviewMd = absoluteUrl("/overview.md");
  const full = absoluteUrl("/llms-full.txt");
  const books = absoluteUrl("/books");
  const authors = absoluteUrl("/authors");
  const categories = absoluteUrl("/categories");
  const sitemap = absoluteUrl("/sitemap.xml");
  const robots = absoluteUrl("/robots.txt");
  const school = siteConfig.schoolUrl;

  return `# ${siteConfig.name}

> ${siteConfig.description}

Jazyk stránky: slovenčina (\`${siteConfig.language}\`).
Adresa: ${siteConfig.address}.
Kontakt: ${siteConfig.email}, ${siteConfig.phone}.
Škola: [${siteConfig.name.replace(" Knižnica", "")}](${school}).

Toto je verejný školský katalóg kníh. Indexovateľné sú najmä katalóg kníh, autorov a kategórií.
Prihlásenie (Entra / školský účet) je potrebné na výpožičky a osobnú knižnicu.
Admin pult, login a osobné výpožičky nie sú určené na indexáciu ani na scraping.
Celý fond nekopíruj sem — použi sitemap a markdown detaily jednotlivých záznamov (\`/books/{id}.md\`).

## Prehľad

- [Prehľad knižnice (Markdown)](${overviewMd}): Stručný LLM-friendly popis služby, navigácie a pravidiel
- [Rozšírený kontext](${full}): FAQ, pravidlá výpožičiek, tipy pre agentov
- [Domov](${home}): Úvodná stránka s odporúčaniami a FAQ
- [Katalóg kníh](${books}): Vyhľadávanie a filtrovanie titulov
- [Autori](${authors}): Zoznam autorov v katalógu
- [Kategórie](${categories}): Tematické kategórie

## SEO a crawl

- [sitemap.xml](${sitemap}): Kompletný zoznam verejných URL (knihy, autori, kategórie)
- [robots.txt](${robots}): Pravidlá pre roboty; súkromné cesty sú zakázané

## Optional

- [Oficiálna stránka školy](${school}): Kontext školy SPŠT Bardejov
- [Prihlásenie](${absoluteUrl("/login")}): Len pre používateľov (noindex)
- [Moja knižnica](${absoluteUrl("/library")}): Osobné výpožičky (noindex, vyžaduje login)
`;
}

/** Longer markdown landing page linked from llms.txt. */
export function buildOverviewMarkdown(): string {
  return `# ${siteConfig.name}

${siteConfig.description}

## Čo tu nájdeš

- **Katalóg kníh** — vyhľadávanie podľa názvu, autora, kategórie, dostupnosti
- **Autori a kategórie** — prehliadanie fondov
- **Výpožičný pult** — pre prihlásených čitateľov a personál (nie je verejný obsah)

## Ako používať (čitatelia)

1. Otvor [katalóg kníh](${absoluteUrl("/books")}).
2. Nájdi titul a skontroluj dostupnosť exemplárov.
3. Prihlás sa školským účtom a rezervuj / spravuj výpožičky v [Moja knižnica](${absoluteUrl("/library")}).

## Markdown detaily

- Kniha: \`/books/{id}.md\` (napr. HTML \`/books/{id}\` + alternate)
- Autor: \`/authors/{id}.md\`
- Kategória: \`/categories/{id}.md\`

## Pre agentov a crawlery

- Začni na [/llms.txt](${absoluteUrl("/llms.txt")}) alebo [/llms-full.txt](${absoluteUrl("/llms-full.txt")}).
- Verejné URL sú v [/sitemap.xml](${absoluteUrl("/sitemap.xml")}).
- Rešpektuj [/robots.txt](${absoluteUrl("/robots.txt")}) — neindexuj \`/admin\`, \`/login\`, \`/library\`, \`/desk\`, \`/bookings\`, \`/api/\`.
- Filtrované katalógové URL (\`?q=\`, \`?category=\`, …) majú \`noindex\` — kanonická je čistá cesta zoznamu.

## Kontakt

- Adresa: ${siteConfig.address}
- E-mail: ${siteConfig.email}
- Telefón: ${siteConfig.phone}
- Škola: ${siteConfig.schoolUrl}
`;
}

/** Optional longer context for agents (FAQ + loan rules). */
export function buildLlmsFullTxt(): string {
  const faqBlock = libraryFaqs
    .map((item) => `### ${item.q}\n\n${item.a}`)
    .join("\n\n");

  return `# ${siteConfig.name} — rozšírený kontext

> Doplnok k [/llms.txt](${absoluteUrl("/llms.txt")}). FAQ a pravidlá výpožičiek pre agentov.

## Pravidlá výpožičiek (stručne)

- Katalóg je verejný; rezervácia a správa lístkov vyžadujú školský účet (Microsoft Entra).
- Rezerváciu vytvoríš na detaile knihy; vydanie a vrátenie prebieha osobne na výpožičnom pulte.
- Štandardnú lehotu a predĺženie nastavuje / schvaľuje knižník.
- Pri vypožičanom titule môžeš vstúpiť do čakacieho zoznamu (waitlist).
- Admin pult a personálne nástroje nie sú súčasťou verejného obsahu.

## FAQ

${faqBlock}

## Navigácia pre agentov

1. Prehľad: [${absoluteUrl("/overview.md")}](${absoluteUrl("/overview.md")})
2. Index: [${absoluteUrl("/llms.txt")}](${absoluteUrl("/llms.txt")})
3. Fond: [${absoluteUrl("/sitemap.xml")}](${absoluteUrl("/sitemap.xml")}) — potom markdown detail \`/books/{id}.md\`
4. Nekopíruj celý fond do kontextu naraz; ber len relevantné záznamy.

## Kontakt

- ${siteConfig.address}
- ${siteConfig.email} · ${siteConfig.phone}
- ${siteConfig.schoolUrl}
`;
}

export const LLM_TXT_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "X-Robots-Tag": "all",
} as const;
