import Link from "next/link";
import { ArrowUpRight, BookOpen, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReadingIntro() {
  return (
    <section className="relative z-10 border-t border-rule/70 bg-paper">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 sm:px-5 sm:py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:px-8 md:py-20">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
            Čitateľský priestor
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,6vw,4rem)] leading-[1.05] text-ink">
            Pripravení na ďalšiu knihu?
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Landing ťa navedie ku konkrétnemu titulu. Katalóg drží autorov,
            kategórie a dostupnosť exemplárov — všetko cez školský gateway.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="rounded-full"
              render={<Link href="/books" />}
            >
              Začať čítať
              <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              render={<Link href="/authors" />}
            >
              <Users className="size-4" strokeWidth={1.8} aria-hidden />
              Prehliadať autorov
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(166,139,103,0.18),transparent_55%)]"
          />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-rule/80 bg-paper-deep shadow-[0_30px_80px_rgba(26,23,20,0.12)]">
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              <div className="border-b border-rule/70 bg-[#f3ebe0] p-5 sm:border-r sm:border-b-0 md:p-6">
                <p className="inline-flex items-center gap-2 font-display text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  Kapitola
                </p>
                <p className="mt-4 font-display text-2xl leading-snug text-ink">
                  Katalóg, ktorý drží tempo s triedou
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Jedna kniha, jeden autor, jedna kategória. Messaging a cache
                  držia väzby aktuálne.
                </p>
              </div>
              <div className="bg-[#ebe2d4] p-5 md:p-6">
                <p className="inline-flex items-center gap-2 font-display text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  <Radio className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  Stav
                </p>
                <ul className="mt-4 space-y-3 text-sm text-ink/80">
                  <li className="flex items-center justify-between border-b border-rule/60 pb-2">
                    <span>Knihy</span>
                    <span className="font-semibold text-accent-deep dark:text-accent">
                      live
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-rule/60 pb-2">
                    <span>Autori</span>
                    <span className="font-semibold text-accent-deep dark:text-accent">
                      1 : N
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Gateway</span>
                    <span className="font-semibold text-accent-deep dark:text-accent">
                      5200
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
