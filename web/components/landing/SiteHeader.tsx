"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn, Menu, X } from "@/components/icons";
import { useAbility } from "@/components/auth/AbilityProvider";
import { AuthNavCluster } from "@/components/auth/AuthNavCluster";
import { BrandLogo } from "@/components/brand-logo";
import { AppTourTrigger } from "@/components/onboarding/AppTourTrigger";
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
import { DotGridOverlay } from "@/components/styled/primitives";
import { cn } from "@/lib/utils";
import styled from "styled-components";

const HeaderBar = styled.header`
  position: relative;
  z-index: 20;
  display: flex;
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1rem;

  @media (min-width: 640px) {
    gap: 1rem;
    padding-inline: 1.5rem;
  }

  @media (min-width: 768px) {
    padding-inline: 2rem;
    padding-block: 1.75rem;
  }
`;

const BrandSlot = styled.div`
  flex-shrink: 0;
  min-width: 0;
`;

const DesktopNavSlot = styled.div`
  display: none;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  overflow-x: auto;

  @media (min-width: 1280px) {
    display: flex;
  }

  & a {
    flex-shrink: 0;
  }
`;

const ActionsCluster = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  margin-left: auto;
  align-items: center;
  gap: 0.5rem;
`;

const MenuTriggerButton = styled(Button)`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;

  @media (min-width: 1280px) {
    display: none;
  }
`;

const links = [
  {
    href: "/",
    label: "Domov",
    note: "Úvod a fond",
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
    href: "/library",
    label: "Moja knižnica",
    note: "Moje lístky a termíny",
    isActive: (pathname: string) => pathname.startsWith("/library"),
  },
  {
    href: "/bookings",
    label: "Výpožičky",
    note: "Výpožičný pult",
    isActive: (pathname: string) =>
      pathname.startsWith("/bookings") || pathname.startsWith("/desk"),
  },
] as const;

function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const ability = useAbility();
  const visibleLinks = links.filter((link) => {
    if (link.href === "/bookings" || link.href === "/library") {
      return ability.can("access", "BookingsPage");
    }
    return true;
  });

  return (
    <nav className={className} data-tour="nav" aria-label="Hlavná navigácia">
      {visibleLinks.map((link) => {
        const active = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
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
  const ability = useAbility();
  const visibleLinks = links.filter((link) => {
    if (link.href === "/bookings" || link.href === "/library") {
      return ability.can("access", "BookingsPage");
    }
    return true;
  });

  return (
    <nav className="mt-2 flex flex-1 flex-col" aria-label="Mobilné menu">
      <p className="px-5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
        Obsah
      </p>
      <ul className="mt-4 border-y border-rule dark:border-white/10">
        {visibleLinks.map((link, index) => {
          const active = link.isActive(pathname);
          const n = String(index + 1).padStart(2, "0");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-baseline gap-4 px-5 py-4 transition",
                  "border-b border-rule last:border-b-0 dark:border-white/10",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-paper-deep/80 dark:hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "w-8 shrink-0 font-mono text-[11px] tracking-[0.16em]",
                    active
                      ? "text-accent-foreground/55"
                      : "text-muted-foreground",
                  )}
                >
                  {n}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-display text-[1.65rem] leading-none tracking-tight",
                      active ? "text-accent-foreground" : "text-ink",
                    )}
                  >
                    {link.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block text-xs tracking-wide",
                      active
                        ? "text-accent-foreground/60"
                        : "text-muted-foreground",
                    )}
                  >
                    {link.note}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "mt-1 size-4 shrink-0 transition group-hover:translate-x-0.5",
                    active ? "text-accent-foreground" : "text-ink/35",
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
    <HeaderBar role="banner" className="reveal">
      <BrandSlot>
        <BrandLogo />
      </BrandSlot>

      <Suspense
        fallback={
          <DesktopNavSlot as="nav" aria-hidden>
            {links.map((link) => (
              <span key={link.href} className="shrink-0 text-sm text-ink/50">
                {link.label}
              </span>
            ))}
          </DesktopNavSlot>
        }
      >
        <DesktopNavSlot as={DesktopNav} />
      </Suspense>

      <ActionsCluster>
        <AppTourTrigger />
        <ThemeToggle />
        <AuthNavCluster />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <MenuTriggerButton
                variant="outline"
                size="icon"
                className="border-rule dark:border-white/25 dark:text-white"
                aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
                aria-expanded={open}
                aria-controls="mobile-nav-sheet"
              />
            }
          >
            <Menu className="size-4" aria-hidden />
          </SheetTrigger>
          <SheetContent
            id="mobile-nav-sheet"
            side="right"
            showCloseButton={false}
            className="w-[min(100%,22rem)] gap-0 border-l border-rule bg-paper p-0 shadow-[-18px_0_40px_rgba(0,0,0,0.18)] dark:border-white/10 dark:shadow-[-18px_0_40px_rgba(0,0,0,0.55)]"
          >
            <DotGridOverlay
              aria-hidden
              $size="14px 14px"
              className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
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
                  <X className="size-4" strokeWidth={1.8} aria-hidden />
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
                  <span className="flex items-center justify-center bg-ink px-3.5 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
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
      </ActionsCluster>
    </HeaderBar>
  );
}
