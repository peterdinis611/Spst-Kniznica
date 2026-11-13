import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MeetupBanner() {
  return (
    <section className="on-accent relative z-10 bg-accent px-4 py-12 text-accent-foreground sm:px-6 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-[1fr_1.2fr_1fr] md:gap-6">
        <div className="hidden aspect-square overflow-hidden bg-accent-foreground/10 md:block">
          <div className="flex h-full flex-col justify-between p-5">
            <p className="font-display text-2xl text-accent-foreground">Autori</p>
            <p className="text-sm text-accent-foreground/70">Živé väzby 1 : N</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-tight tracking-tight text-accent-foreground uppercase">
            SPST knižný
            <br />
            fond 2026
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-accent-foreground/75">
            Katalóg kníh, autorov a kategórií cez gateway. Otvor Swagger alebo
            skoč rovno do fondu.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/books"
              className="split-cta group border border-accent-foreground/40 bg-paper text-ink"
            >
              <span className="px-5 py-3 text-sm font-semibold text-ink">
                Vytvoriť účet
              </span>
              <span className="flex items-center bg-ink px-3 text-paper transition group-hover:bg-paper group-hover:text-ink">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
            <a
              href="http://localhost:5200/swagger"
              target="_blank"
              rel="noreferrer"
              className="border border-accent-foreground/50 px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-foreground hover:text-accent"
            >
              Gateway API
            </a>
          </div>
        </div>

        <div className="hidden aspect-square overflow-hidden bg-accent-foreground/10 md:block">
          <div className="flex h-full flex-col justify-between p-5">
            <p className="font-display text-2xl text-accent-foreground">Kategórie</p>
            <p className="text-sm text-accent-foreground/70">Tematické rady</p>
          </div>
        </div>
      </div>
    </section>
  );
}
