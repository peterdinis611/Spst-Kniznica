import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Prihlásenie",
  description: "Prihlásenie do SPST Knižnice cez Microsoft Entra ID.",
  alternates: { canonical: "/login" },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 md:px-8">
        <BrandLogo />
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Účet
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
          Prihlásenie
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          AuthService overí token (Entra JWT) alebo Development principal.
        </p>

        <div className="mt-8">
          <LoginPanel />
        </div>
      </div>
    </main>
  );
}
