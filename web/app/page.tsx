import { Suspense } from "react";
import Link from "next/link";
import { LandingCarouselSection } from "@/components/landing/LandingCarouselSection";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(166,139,103,0.12),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(47,74,60,0.06),transparent_45%)]" />
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" />

      <SiteHeader />

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-6 pt-2 md:px-8 md:pt-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="reveal font-display text-[clamp(2.2rem,5.8vw,4.1rem)] leading-[1.08] font-medium tracking-[-0.02em] text-balance text-ink">
            Objavujte autorov a ich knihy bez námahy
          </h1>
          <p className="reveal reveal-delay-1 mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
            Vitajte v SPST Knižnici — katalóg kníh, autorov a kategórií. Prehľadávajte
            tituly, exempláre a väzby medzi autormi jednoducho.
          </p>

          <div className="reveal reveal-delay-2 mt-6 flex justify-center">
            <Link
              href="/books"
              className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-accent px-10 py-3 text-sm tracking-[0.04em] text-paper shadow-[0_12px_40px_rgba(166,139,103,0.35)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
            >
              Hľadať
            </Link>
          </div>
        </div>

        <div className="reveal reveal-delay-3 mt-4 md:mt-5">
          <Suspense
            fallback={
              <div className="flex h-[320px] items-center justify-center sm:h-[380px] md:h-[420px]">
                <div className="h-10 w-10 animate-pulse rounded-full border border-accent/40" />
              </div>
            }
          >
            <LandingCarouselSection />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
