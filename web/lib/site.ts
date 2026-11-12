export const siteConfig = {
  name: "SPST Knižnica",
  shortName: "SPST",
  description:
    "Školský katalóg Strednej priemyselnej školy — knihy, autori, kategórie a výpožičný pult na jednom mieste.",
  locale: "sk_SK",
  language: "sk",
  /** Globálny stav produktu — UI banner + robots. */
  stage: "development" as "development" | "production",
  keywords: [
    "SPST",
    "knižnica",
    "školský katalóg",
    "výpožičky",
    "autori",
    "kategórie",
    "Stredná priemyselná škola",
  ],
} as const;

export const isDevelopmentStage = siteConfig.stage === "development";


export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (raw) {
    const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(withProtocol.replace(/\/$/, ""));
  }

  return new URL("http://localhost:3000");
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, getSiteUrl()).toString();
}
