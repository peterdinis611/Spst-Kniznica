import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MainContent } from "@/components/a11y/MainContent";
import { BrandLogo } from "@/components/brand-logo";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { AppOnboarding } from "@/components/onboarding/AppOnboarding";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Prihlásenie",
  description: "Prihlásenie do SPST Knižnica a sprievodca použitím.",
  alternates: { canonical: "/login" },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Prihlásenie",
    description: "Prihlásenie do SPST Knižnica cez školský Microsoft Entra účet.",
    url: "/login",
  },
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_-5%,color-mix(in_oklch,var(--mint),transparent_45%),transparent),radial-gradient(ellipse_50%_40%_at_-5%_90%,color-mix(in_oklch,var(--accent-soft),transparent_50%),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(180deg,transparent,color-mix(in_oklch,var(--paper-deep),transparent_35%)_40%,transparent)] lg:block"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 md:px-8">
        <BrandLogo />
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Prihlásenie">
          <Link
            href="/books"
            className="hidden px-2 py-1.5 text-sm text-muted-foreground transition hover:text-ink sm:inline"
          >
            Katalóg
          </Link>
          <Link
            href="/"
            className="px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-ink"
          >
            Domov
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <MainContent className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6 md:px-8 md:pb-16">
        <div className="reveal max-w-2xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-eyebrow uppercase">
            Účet & sprievodca
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] tracking-tight text-ink">
            Prihlásenie
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            Školský účet odomkne rezervácie. Sprievodca vpravo ťa prevedie
            katalógom až po výpožičný lístok.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:mt-14 lg:grid-cols-[minmax(17.5rem,22rem)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          <div className="reveal reveal-delay-1 lg:sticky lg:top-8">
            <Suspense fallback={<CatalogSkeleton variant="panel" />}>
              <LoginPanel />
            </Suspense>
          </div>
          <div className="reveal reveal-delay-2 min-w-0">
            <AppOnboarding />
          </div>
        </div>
      </MainContent>

      <footer className="relative z-10 mt-auto border-t border-rule/70 bg-paper-deep/35 px-4 py-5 sm:px-6 md:px-8 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© SPST Knižnica</span>
          <Link
            href="/books"
            className="font-medium text-sage underline-offset-4 transition hover:text-ink hover:underline dark:text-ink/80 dark:hover:text-ink"
          >
            Prejsť do katalógu →
          </Link>
        </div>
      </footer>
    </div>
  );
}
