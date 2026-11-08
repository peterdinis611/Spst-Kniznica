import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Prihlásenie",
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
          Prihlás sa do SPST Knižnice. Napojenie na AuthService príde neskôr —
          zatiaľ UI mock.
        </p>

        <form
          action="/books"
          className="mt-8 space-y-4 border border-rule bg-paper-deep/40 p-5 sm:p-6 dark:border-white/10"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="meno@spst.sk"
              required
              className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-none bg-accent text-black hover:bg-accent-deep"
          >
            Prihlásiť sa
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Späť na{" "}
          <Link href="/" className="font-medium text-ink underline-offset-4 hover:underline">
            landing
          </Link>
        </p>
      </div>
    </main>
  );
}
