"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  {
    href: "/books",
    label: "Knihy",
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
] as const;

function CatalogNav({
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
            className={`relative text-sm font-medium transition ${
              active
                ? "text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-accent"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CatalogShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-paper">
      <header className="relative z-20 border-b border-rule">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-8 md:py-5">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <Link
              href="/"
              className="truncate text-[1.05rem] font-semibold tracking-tight lowercase"
            >
              spst knižnica<span className="text-accent">.</span>
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              katalóg
            </span>
          </div>

          <Suspense fallback={<div className="hidden h-5 w-48 md:block" aria-hidden />}>
            <CatalogNav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex" />
          </Suspense>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-none px-2 sm:inline-flex"
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
              Landing
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-full border-ink md:hidden"
                    aria-label="Otvoriť menu"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100%,20rem)] bg-paper">
                <SheetHeader>
                  <SheetTitle className="lowercase tracking-tight">
                    katalóg.
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-5 px-1">
                  <Suspense fallback={null}>
                    <CatalogNav
                      className="flex flex-col gap-4"
                      onNavigate={() => setOpen(false)}
                    />
                  </Suspense>
                  <Separator />
                  <Button
                    variant="outline"
                    className="rounded-none"
                    render={<Link href="/" />}
                    onClick={() => setOpen(false)}
                  >
                    ← Landing
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
