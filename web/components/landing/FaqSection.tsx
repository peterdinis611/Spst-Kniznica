import Link from "next/link";

const faqs = [
  {
    q: "Potrebujem účet na prehliadanie katalógu?",
    a: "Nie. Katalóg kníh, autorov a kategórií je verejný. Účet Microsoft Entra potrebuješ až na rezerváciu a správu výpožičiek.",
  },
  {
    q: "Ako si rezervujem knihu?",
    a: "Otvor detail titulu, prihlás sa a vystav rezerváciu. Keď je exemplár voľný, knižník ťa obslúži na výpožičnom pulte.",
  },
  {
    q: "Čo ak je kniha vypožičaná?",
    a: "Môžeš sa zaradiť do čakacieho zoznamu. Po vrátení exemplára ťa systém upozorní v poradí fronty.",
  },
  {
    q: "Kde knižnicu fyzicky nájdem?",
    a: "Sme v budove Strednej priemyselnej školy technickej, Komenského 5, Bardejov. Presnú polohu máš v mape v pätičke stránky.",
  },
  {
    q: "Ako dlho trvá výpožička?",
    a: "Štandardnú lehotu nastavuje knižník. Predĺženie môžeš požiadať z Mojej knižnice, kým nie si po termíne.",
  },
  {
    q: "Môžem rezervovať aj mimo školy?",
    a: "Áno, cez web. Vyzdvihnutie a vrátenie však prebieha osobne na školskom výpožičnom pulte.",
  },
] as const;

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative z-10 border-t border-rule bg-paper"
      aria-labelledby="faq-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "18px 18px",
          color: "var(--ink)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.85fr_1.15fr] md:gap-14 md:px-8 md:py-20">
        <div className="md:sticky md:top-10 md:self-start">
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            Otázky · odpovede
          </p>
          <h2
            id="faq-heading"
            className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-tight text-ink"
          >
            Často sa pýtate
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Stručné odpovede ku katalógu, rezerváciám a výpožičnému pultu SPŠT
            Bardejov.
          </p>
          <Link
            href="/books"
            className="mt-8 inline-flex items-center gap-2 border-b border-ink pb-0.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
          >
            Prejsť do katalógu
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="divide-y divide-rule border-y border-rule dark:divide-white/10 dark:border-white/10">
          {faqs.map((item, index) => (
            <details
              key={item.q}
              className="group faq-item py-1"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-left outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-sage/40 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg leading-snug text-ink sm:text-xl">
                  <span
                    className="mr-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.q}
                </span>
                <span
                  className="mt-1 flex size-7 shrink-0 items-center justify-center border border-rule font-mono text-sm text-muted-foreground transition group-open:rotate-45 group-open:border-sage group-open:text-sage dark:border-white/15"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="max-w-xl pb-5 pl-9 text-sm leading-relaxed text-muted-foreground sm:pl-11 sm:text-[15px] sm:leading-7">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
