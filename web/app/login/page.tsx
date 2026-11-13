import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginPanel } from "@/components/auth/LoginPanel";
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
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper bg-[radial-gradient(ellipse_80%_50%_at_100%_-10%,color-mix(in_oklch,var(--mint),transparent_55%),transparent),radial-gradient(ellipse_60%_40%_at_0%_100%,color-mix(in_oklch,var(--accent-soft),transparent_40%),transparent)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 md:px-8">
        <BrandLogo />
        <div className="flex items-center gap-3">
          <Link
            href="/books"
            className="hidden text-sm text-muted-foreground transition hover:text-ink sm:inline"
          >
            Katalóg
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition hover:text-ink"
          >
            Domov
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 md:px-8 md:pb-14">
        <p className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
          Účet & sprievodca
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.25rem)] leading-tight tracking-tight text-ink">
          Prihlásenie
        </h1>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-8">
            <LoginPanel />
          </div>
          <AppOnboarding />
        </div>
      </div>

      <footer className="mt-auto border-t border-rule/80 bg-paper-deep/40 px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© SPST Knižnica</span>
          <Link
            href="/books"
            className="font-medium text-sage transition hover:text-ink dark:text-ink/80 dark:hover:text-ink"
          >
            Prejsť do katalógu →
          </Link>
        </div>
      </footer>
    </main>
  );
}
