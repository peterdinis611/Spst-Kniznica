"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  {
    href: "/",
    label: "Domov",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/books",
    label: "Katalóg",
    isActive: (pathname: string) =>
      pathname === "/books" || pathname.startsWith("/books/"),
  },
  {
    href: "/authors",
    label: "Autori",
    isActive: (pathname: string) => pathname.startsWith("/authors"),
  },
  {
    href: "/categories",
    label: "Kategórie",
    isActive: (pathname: string) => pathname.startsWith("/categories"),
  },
  {
    href: "/bookings",
    label: "Výpožičky",
    isActive: (pathname: string) => pathname.startsWith("/bookings"),
  },
] as const;

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {links.map((link) => {
        const active = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`relative text-sm font-medium tracking-wide transition ${
              active
                ? "text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-accent"
                : "text-ink/60 hover:text-ink dark:text-white/80 dark:hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
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
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:gap-8 lg:flex" aria-hidden>
            {links.map((link) => (
              <span key={link.href} className="text-sm text-ink/50">
                {link.label}
              </span>
            ))}
          </nav>
        }
      >
        <NavLinks className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:gap-8 lg:flex" />
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
          <SheetContent side="right" className="w-[min(100%,20rem)] bg-paper">
            <SheetHeader>
              <SheetTitle className="tracking-tight">SPST Knižnica.</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-5 px-1">
              <Suspense fallback={null}>
                <NavLinks
                  className="flex flex-col gap-4"
                  onNavigate={() => setOpen(false)}
                />
              </Suspense>
              <Button
                className="rounded-none bg-accent text-black hover:bg-accent-deep"
                render={<Link href="/login" />}
                onClick={() => setOpen(false)}
              >
                Prihlásiť sa
              </Button>
              <Button
                variant="outline"
                className="rounded-none"
                render={<Link href="/books" />}
                onClick={() => setOpen(false)}
              >
                Do katalógu
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
