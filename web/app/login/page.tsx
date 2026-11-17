import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MainContent } from "@/components/a11y/MainContent";
import { LoginPanel, LoginPanelSkeleton } from "@/components/auth/LoginPanel";
import { BrandLogo } from "@/components/brand-logo";
import { AppOnboarding } from "@/components/onboarding/AppOnboarding";
import { RuleDotGrid } from "@/components/styled/primitives";
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
        className="pointer-events-none absolute top-0 right-0 hidden h-[40rem] w-[min(46vw,36rem)] lg:block"
      >
        <RuleDotGrid className="h-full w-full text-rule/80" />
        <div className="absolute inset-y-16 left-0 w-px bg-rule" />
      </div>

      <header className="relative z-10 border-b border-rule/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 md:px-8">
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
        </div>
      </header>

      <MainContent className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-16">
        <Suspense fallback={<LoginPanelSkeleton />}>
          <LoginPanel />
        </Suspense>
        <AppOnboarding className="mt-16 sm:mt-20 lg:mt-28" />
      </MainContent>

      <footer className="relative z-10 mt-auto border-t border-rule/80 px-4 py-5 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© SPST Knižnica</span>
          <Link
            href="/books"
            className="font-medium text-sage underline-offset-4 transition hover:text-ink hover:underline"
          >
            Prejsť do katalógu →
          </Link>
        </div>
      </footer>
    </div>
  );
}
