"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Domov" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
  { href: "/books", label: "Knihy" },
] as const;

function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-7 md:flex">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[13px] transition ${
              active ? "text-accent" : "text-muted hover:text-ink"
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
  return (
    <header className="reveal relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
      <Link href="/" className="group flex items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-paper-deep/70">
          <svg
            viewBox="0 0 40 40"
            className="h-6 w-6 text-accent transition duration-500 group-hover:-translate-y-0.5"
            aria-hidden
          >
            <path
              d="M8 28c4-8 7-14 8-18 1 4 4 10 8 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 27h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14 12c2-3 4-5 6-7 2 2 4 4 6 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </span>
        <span className="font-display text-[13px] tracking-[0.22em] text-ink uppercase">
          SPST Knižnica
        </span>
      </Link>

      <Suspense
        fallback={
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <span key={link.href} className="text-[13px] text-muted">
                {link.label}
              </span>
            ))}
          </nav>
        }
      >
        <NavLinks />
      </Suspense>

      <div className="flex items-center gap-2">
        <Link
          href="/books"
          className="rounded-full border border-accent/50 px-4 py-2 text-[12px] tracking-[0.04em] text-ink transition hover:border-accent hover:bg-paper-deep"
        >
          Katalóg
        </Link>
        <Link
          href="/authors"
          className="rounded-full bg-accent px-4 py-2 text-[12px] tracking-[0.04em] text-paper transition hover:bg-accent-deep"
        >
          Autori
        </Link>
      </div>
    </header>
  );
}
