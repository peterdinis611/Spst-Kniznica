export const siteConfig = {
  name: "SPST Knižnica",
  shortName: "SPST",
  description:
    "Školský katalóg Strednej priemyselnej školy technickej v Bardejove — knihy, autori, kategórie a výpožičný pult na jednom mieste.",
  locale: "sk_SK",
  language: "sk",
  /** Official postal address — shown in footer / SEO. */
  address:
    process.env.NEXT_PUBLIC_LIBRARY_ADDRESS?.trim() ||
    "Stredná priemyselná škola technická, Komenského 5, 085 42 Bardejov",
  addressShort: "Komenského 5, Bardejov",
  /** Nominatim search string (keep short for reliable hits). */
  geocodeQuery:
    process.env.NEXT_PUBLIC_LIBRARY_GEOCODE_QUERY?.trim() ||
    "Stredná priemyselná škola technická, Bardejov",
  city: "Bardejov",
  phone: "+421 54 472 24 50",
  email: "skola@spsbj.sk",
  schoolUrl: "https://www.spsbj.sk",
  keywords: [
    "SPST",
    "SPŠT",
    "Bardejov",
    "knižnica",
    "školský katalóg",
    "výpožičky",
    "autori",
    "kategórie",
    "Stredná priemyselná škola technická",
    "školská knižnica",
    "katalóg kníh",
  ],
} as const;

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
