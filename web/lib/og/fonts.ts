type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 700;
  style: "normal";
};

const FONT_VERSION = "5.2.5";

const FONT_URLS = [
  {
    name: "Fraunces",
    weight: 700 as const,
    hrefs: [
      `https://cdn.jsdelivr.net/fontsource/fonts/fraunces@${FONT_VERSION}/latin-700-normal.woff`,
      `https://cdn.jsdelivr.net/fontsource/fonts/fraunces@${FONT_VERSION}/latin-ext-700-normal.woff`,
    ],
  },
  {
    name: "Sora",
    weight: 400 as const,
    hrefs: [
      `https://cdn.jsdelivr.net/fontsource/fonts/sora@${FONT_VERSION}/latin-400-normal.woff`,
      `https://cdn.jsdelivr.net/fontsource/fonts/sora@${FONT_VERSION}/latin-ext-400-normal.woff`,
    ],
  },
  {
    name: "Sora",
    weight: 500 as const,
    hrefs: [
      `https://cdn.jsdelivr.net/fontsource/fonts/sora@${FONT_VERSION}/latin-500-normal.woff`,
      `https://cdn.jsdelivr.net/fontsource/fonts/sora@${FONT_VERSION}/latin-ext-500-normal.woff`,
    ],
  },
  {
    name: "IBM Plex Mono",
    weight: 400 as const,
    hrefs: [
      `https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@${FONT_VERSION}/latin-400-normal.woff`,
      `https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@${FONT_VERSION}/latin-ext-400-normal.woff`,
    ],
  },
] as const;

let fontsPromise: Promise<OgFont[]> | null = null;

async function fetchFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!response.ok) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

/** Brand fonts for `ImageResponse` (Fraunces + Sora + IBM Plex Mono, latin + latin-ext). */
export async function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const loaded: OgFont[] = [];

      for (const font of FONT_URLS) {
        for (const href of font.hrefs) {
          const data = await fetchFont(href);
          if (!data) continue;
          loaded.push({
            name: font.name,
            data,
            weight: font.weight,
            style: "normal",
          });
        }
      }

      return loaded;
    })();
  }

  return fontsPromise;
}
