"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Menu } from "lucide-react";
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
  { href: "/", label: "Domov" },
  { href: "/books", label: "Katalóg" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
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
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`text-sm font-medium transition ${
              active ? "text-ink" : "text-muted-foreground hover:text-ink"
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
    <header className="reveal relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 md:px-8 md:py-7">
      <Link
        href="/"
        className="shrink-0 text-[1.05rem] font-semibold tracking-tight lowercase sm:text-lg"
      >
        spst knižnica<span className="text-accent">.</span>
      </Link>

      <Suspense
        fallback={
          <nav className="hidden items-center gap-8 md:flex" aria-hidden>
            {links.map((link) => (
              <span key={link.href} className="text-sm text-muted-foreground">
                {link.label}
              </span>
            ))}
          </nav>
        }
      >
        <NavLinks className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex" />
      </Suspense>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          size="icon"
          className="hidden size-10 rounded-full bg-ink text-paper hover:bg-ink/85 md:inline-flex"
          aria-label="Otvoriť katalóg"
          render={<Link href="/books" />}
        >
          <Library className="size-4" strokeWidth={1.8} />
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
                spst knižnica.
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-5 px-1">
              <Suspense fallback={null}>
                <NavLinks
                  className="flex flex-col gap-4"
                  onNavigate={() => setOpen(false)}
                />
              </Suspense>
              <Button
                className="mt-2 rounded-none"
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
