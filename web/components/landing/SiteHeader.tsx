"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/",
    label: "Domov",
    note: "Landing a fond",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/books",
    label: "Katalóg",
    note: "Tituly a exempláre",
    isActive: (pathname: string) =>
      pathname === "/books" || pathname.startsWith("/books/"),
  },
  {
    href: "/authors",
    label: "Autori",
    note: "Mená z fondu",
    isActive: (pathname: string) => pathname.startsWith("/authors"),
  },
  {
    href: "/categories",
    label: "Kategórie",
    note: "Tematické rady",
    isActive: (pathname: string) => pathname.startsWith("/categories"),
  },
  {
    href: "/bookings",
    label: "Výpožičky",
    note: "Výpožičný pult",
    isActive: (pathname: string) => pathname.startsWith("/bookings"),
  },
] as const;

function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {links.map((link) => {
        const active = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative text-sm font-medium tracking-wide transition",
              active
                ? "text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-accent"
                : "text-ink/60 hover:text-ink dark:text-white/80 dark:hover:text-white",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="mt-2 flex flex-1 flex-col" aria-label="Mobilné menu">
      <p className="px-5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
        Obsah
      </p>
      <ul className="mt-4 border-y border-rule dark:border-white/10">
        {links.map((link, index) => {
          const active = link.isActive(pathname);
          const n = String(index + 1).padStart(2, "0");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-baseline gap-4 px-5 py-4 transition",
                  "border-b border-rule last:border-b-0 dark:border-white/10",
                  active
                    ? "bg-accent text-black"
                    : "hover:bg-paper-deep/80 dark:hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "w-8 shrink-0 font-mono text-[11px] tracking-[0.16em]",
                    active ? "text-black/55" : "text-muted-foreground",
                  )}
                >
                  {n}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-display text-[1.65rem] leading-none tracking-tight",
                      active ? "text-black" : "text-ink",
                    )}
                  >
                    {link.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block text-xs tracking-wide",
                      active ? "text-black/60" : "text-muted-foreground",
                    )}
                  >
                    {link.note}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "mt-1 size-4 shrink-0 transition group-hover:translate-x-0.5",
                    active ? "text-black" : "text-ink/35",
                  )}
                  strokeWidth={1.8}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="reveal relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:gap-4 sm:px-6 md:px-8 md:py-7">
      <BrandLogo />

      <Suspense
        fallback={
          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:gap-8 lg:flex"
            aria-hidden
          >
            {links.map((link) => (
              <span key={link.href} className="text-sm text-ink/50">
                {link.label}
              </span>
            ))}
          </nav>
        }
      >
        <DesktopNav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:gap-8 lg:flex" />
      </Suspense>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          size="sm"
          className="hidden h-10 rounded-full bg-accent px-4 text-black hover:bg-accent-deep sm:inline-flex"
          render={<Link href="/login" />}
        >
          <LogIn className="size-3.5" strokeWidth={1.8} aria-hidden />
          Prihlásiť
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="size-10 rounded-full border-rule sm:hidden dark:border-white/25 dark:text-white"
          aria-label="Prihlásiť sa"
          render={<Link href="/login" />}
        >
          <LogIn className="size-4" strokeWidth={1.8} />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full border-rule dark:border-white/25 dark:text-white lg:hidden"
                aria-label="Otvoriť menu"
              />
            }
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[min(100%,22rem)] gap-0 border-l border-rule bg-paper p-0 shadow-[-18px_0_40px_rgba(0,0,0,0.18)] dark:border-white/10 dark:shadow-[-18px_0_40px_rgba(0,0,0,0.55)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "14px 14px",
                color: "var(--ink)",
              }}
            />

            <SheetHeader className="relative border-b border-rule px-5 py-5 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="font-display text-2xl tracking-tight text-ink">
                    SPST Knižnica
                    <span className="text-accent">.</span>
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                    Školský fond
                  </SheetDescription>
                </div>
                <SheetClose
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0 rounded-full border-rule dark:border-white/20"
                      aria-label="Zavrieť menu"
                    />
                  }
                >
                  <X className="size-4" strokeWidth={1.8} />
                </SheetClose>
              </div>
            </SheetHeader>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
              <Suspense fallback={null}>
                <MobileNav onNavigate={() => setOpen(false)} />
              </Suspense>

              <div className="mt-auto space-y-3 border-t border-rule p-5 dark:border-white/10">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="split-cta group w-full border border-ink bg-paper text-ink transition hover:-translate-y-0.5"
                >
                  <span className="flex items-center px-4 py-3.5 text-sm font-semibold tracking-wide">
                    Prihlásiť sa
                  </span>
                  <span className="flex items-center justify-center bg-ink px-3.5 text-paper transition group-hover:bg-accent group-hover:text-black">
                    <LogIn className="size-4" strokeWidth={1.8} aria-hidden />
                  </span>
                </Link>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-none border-ink"
                  render={<Link href="/books" />}
                  onClick={() => setOpen(false)}
                >
                  Do katalógu
                  <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
