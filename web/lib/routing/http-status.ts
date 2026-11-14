export type HttpStatusCode = 401 | 404 | 500 | 502 | 503;

export type HttpStatusAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export type HttpStatusCopy = {
  code: HttpStatusCode;
  eyebrow: string;
  title: string;
  description: string;
  actions: HttpStatusAction[];
};

export const HTTP_STATUS_COPY: Record<HttpStatusCode, HttpStatusCopy> = {
  401: {
    code: 401,
    eyebrow: "401 · bez prístupu",
    title: "Nie si prihlásený",
    description:
      "Táto časť knižnice je len pre prihlásených. Prihlás sa školským účtom (Entra) a skús to znova.",
    actions: [
      { href: "/login", label: "Prihlásiť sa", primary: true },
      { href: "/", label: "Domov" },
    ],
  },
  404: {
    code: 404,
    eyebrow: "404 · mimo regálov",
    title: "Stránka neexistuje",
    description:
      "Táto cesta v katalógu SPST nie je. Skontroluj URL, alebo sa vráť na úvodnú stránku.",
    actions: [
      { href: "/", label: "Domov", primary: true },
      { href: "/books", label: "Katalóg kníh" },
    ],
  },
  500: {
    code: 500,
    eyebrow: "500 · vnútorná chyba",
    title: "Niečo sa pokazilo",
    description:
      "Na serveri nastala neočakávaná chyba. Skús obnoviť stránku. Ak problém pretrváva, napíš správcovi.",
    actions: [
      { href: "/", label: "Domov", primary: true },
      { href: "/books", label: "Katalóg kníh" },
    ],
  },
  502: {
    code: 502,
    eyebrow: "502 · zlá brána",
    title: "Gateway neodpovedá",
    description:
      "Frontend sa nedokázal spojiť s API bránou. Skontroluj, či beží gateway (port 5200), a skús to znova.",
    actions: [
      { href: "/", label: "Domov", primary: true },
      { href: "/503", label: "Stav služby" },
    ],
  },
  503: {
    code: 503,
    eyebrow: "503 · nedostupné",
    title: "Služba dočasne mimo",
    description:
      "Knižničné API je dočasne nedostupné (údržba alebo výpadok). Skús to o chvíľu — katalóg sa vráti.",
    actions: [
      { href: "/", label: "Domov", primary: true },
      { href: "/books", label: "Skúsiť katalóg" },
    ],
  },
};

export function isHttpStatusCode(value: number): value is HttpStatusCode {
  return value === 401 || value === 404 || value === 500 || value === 502 || value === 503;
}
