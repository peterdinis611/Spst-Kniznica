"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Heart,
  HelpCircle,
  Layers,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

const primaryNav = [
  {
    href: "/books",
    label: "Objaviť",
    Icon: Compass,
    isActive: (pathname: string) =>
      pathname === "/books" || pathname.startsWith("/books/"),
  },
  {
    href: "/categories",
    label: "Kategórie",
    Icon: Layers,
    isActive: (pathname: string) => pathname.startsWith("/categories"),
  },
  {
    href: "/authors",
    label: "Autori",
    Icon: Users,
    isActive: (pathname: string) => pathname.startsWith("/authors"),
  },
  {
    href: "/books",
    label: "Obľúbené",
    Icon: Heart,
    isActive: () => false,
  },
] as const;

const secondaryNav = [
  { href: "/", label: "Landing", Icon: BookOpen },
  { href: "#", label: "Nastavenia", Icon: Settings },
  { href: "/#ako-pouzivat", label: "Pomoc", Icon: HelpCircle },
] as const;

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex flex-1 flex-col gap-1">
      {primaryNav.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-paper-deep font-medium text-ink"
                : "text-muted hover:bg-paper-deep/70 hover:text-ink"
            }`}
          >
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                active ? "bg-accent" : "bg-transparent"
              }`}
            />
            <item.Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden />
            {item.label}
          </Link>
        );
      })}

      <div className="my-4 border-t border-rule/70" />

      {secondaryNav.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition hover:bg-paper-deep/70 hover:text-ink"
        >
          <span className="h-2.5 w-2.5" />
          <item.Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden />
          {item.label}
        </Link>
      ))}

      <button
        type="button"
        className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-muted transition hover:bg-paper-deep/70 hover:text-ink"
      >
        <span className="h-2.5 w-2.5" />
        <LogOut className="h-4 w-4" strokeWidth={1.7} aria-hidden />
        Odhlásiť
      </button>
    </nav>
  );
}

export function CatalogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 bg-[#f3efe8]">
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(196,168,120,0.22),transparent_68%)]" />

      <aside className="relative z-10 hidden w-[15.5rem] shrink-0 flex-col border-r border-rule/60 bg-paper px-5 py-7 md:flex">
        <Link
          href="/books"
          className="font-display text-xl tracking-[0.08em] text-ink uppercase"
        >
          SPST Books
        </Link>

        <Suspense
          fallback={<div className="mt-10 flex-1" aria-hidden />}
        >
          <SidebarNav />
        </Suspense>

        <div className="mt-auto border-t border-rule/70 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
              <BookOpen className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <p className="text-xs tracking-[0.16em] text-muted uppercase">
                Book library
              </p>
              <p className="font-display text-sm text-ink">SPST Knižnica</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-rule/60 bg-paper px-5 py-4 md:hidden">
          <Link
            href="/books"
            className="font-display text-lg tracking-[0.08em] text-ink uppercase"
          >
            SPST Books
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            <Link href="/categories" className="hover:text-ink">
              Kategórie
            </Link>
            <Link href="/authors" className="hover:text-ink">
              Autori
            </Link>
            <Link href="/" className="hover:text-ink">
              Domov
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
