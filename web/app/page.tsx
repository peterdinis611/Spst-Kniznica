import Link from "next/link";

const modules = [
  {
    href: "/books",
    label: "Knihy",
    detail: "Katalóg, exempláre, import",
    code: "01",
  },
  {
    href: "/authors",
    label: "Autori",
    detail: "1 autor · N kníh",
    code: "02",
  },
  {
    href: "/categories",
    label: "Kategórie",
    detail: "1 kategória · N kníh",
    code: "03",
  },
] as const;

export default function HomePage() {
  return (
    <main className="grain relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rotate-12 border border-rule/70 bg-paper-deep/40" />
      <div className="pointer-events-none absolute bottom-16 left-[-4rem] h-40 w-[28rem] -rotate-6 border border-accent/30" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <p className="reveal font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
          SPST · knižničný systém
        </p>
        <nav className="reveal reveal-delay-1 flex items-center gap-5 font-mono text-[11px] tracking-[0.16em] uppercase">
          <a href="#moduly" className="text-muted transition hover:text-ink">
            Moduly
          </a>
          <a
            href={process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200/swagger"}
            className="border border-ink px-3 py-1.5 text-ink transition hover:bg-ink hover:text-paper"
            target="_blank"
            rel="noreferrer"
          >
            API
          </a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-8 md:px-10 md:pb-24">
        <p className="reveal font-mono text-xs tracking-[0.28em] text-accent uppercase">
          Katalóg / 2026
        </p>
        <h1 className="reveal reveal-delay-1 mt-5 max-w-4xl font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.03em] text-balance">
          SPST
          <span className="block text-accent">Knižnica</span>
        </h1>
        <p className="reveal reveal-delay-2 mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
          Priemyselný katalóg kníh, autorov a kategórií. Jedna kniha, jeden autor,
          jedna kategória — cez gateway na mikroslužby.
        </p>

        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/books"
            className="bg-ink px-6 py-3 font-mono text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-accent"
          >
            Otvoriť katalóg
          </Link>
          <Link
            href="/authors"
            className="border border-rule px-6 py-3 font-mono text-xs tracking-[0.18em] text-ink uppercase transition hover:border-ink"
          >
            Autori
          </Link>
        </div>
      </section>

      <section id="moduly" className="relative z-10 border-t border-rule bg-paper-deep/50">
        <div className="mx-auto grid w-full max-w-6xl gap-0 md:grid-cols-3">
          {modules.map((module, index) => (
            <Link
              key={module.href}
              href={module.href}
              className={`group border-rule px-6 py-10 transition hover:bg-paper md:px-8 ${
                index < modules.length - 1 ? "md:border-r" : ""
              } ${index > 0 ? "border-t md:border-t-0" : ""} reveal reveal-delay-${index + 2}`}
            >
              <span className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
                {module.code}
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight transition group-hover:text-accent">
                {module.label}
              </h2>
              <p className="mt-3 text-muted">{module.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
