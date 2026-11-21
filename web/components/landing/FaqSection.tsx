import Link from "next/link";
import {
  AnimationDelayedDetails,
  DotGridOverlay,
} from "@/components/styled/primitives";
import { libraryFaqs } from "@/lib/content/faq";

const faqs = libraryFaqs;

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative z-10 border-t border-rule bg-paper"
      aria-labelledby="faq-heading"
    >
      <DotGridOverlay
        aria-hidden
        $size="18px 18px"
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
      />

      <div className="relative mx-auto grid w-full min-w-0 max-w-6xl gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-8 lg:py-20">
        <div className="min-w-0 lg:sticky lg:top-10 lg:self-start">
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            Otázky · odpovede
          </p>
          <h2
            id="faq-heading"
            className="mt-3 font-display text-[clamp(1.75rem,6vw,3.25rem)] leading-[1.05] tracking-tight text-balance text-ink"
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
            <AnimationDelayedDetails
              key={item.q}
              className="group faq-item py-1"
              $delay={`${index * 0.04}s`}
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
            </AnimationDelayedDetails>
          ))}
        </div>
      </div>
    </section>
  );
}
