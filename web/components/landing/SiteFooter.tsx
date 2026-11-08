import Link from "next/link";
import { cacheLife } from "next/cache";
import {
  ArrowUpRight,
  BookMarked,
  ExternalLink,
  Layers,
  Users,
} from "lucide-react";

const explore = [
  { href: "/books", label: "Knihy", Icon: BookMarked },
  { href: "/authors", label: "Autori", Icon: Users },
  { href: "/categories", label: "Kategórie", Icon: Layers },
] as const;

const stack = [
  { href: "http://localhost:5200/swagger", label: "Gateway API" },
  { href: "http://localhost:5203/swagger", label: "BookService" },
  { href: "http://localhost:5207/swagger", label: "AuthorService" },
  { href: "http://localhost:5204/swagger", label: "CategoryService" },
] as const;

async function getCurrentYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const year = await getCurrentYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-rule/80 bg-ink text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8 md:py-16">
        <div>
          <p className="font-display text-[13px] tracking-[0.22em] uppercase">
            SPST Knižnica
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/65">
            Digitálny katalóg strednej priemyselnej školy. Knihy, autori a
            kategórie cez mikroslužby, gateway a živý landing.
          </p>
          <Link
            href="/books"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm text-ink transition hover:bg-accent hover:text-paper"
          >
            Začať čítať
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.2em] text-paper/45 uppercase">
            Preskúmať
          </p>
          <ul className="mt-4 space-y-3">
            {explore.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-sm text-paper/75 transition hover:text-paper"
                >
                  <item.Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="#ako-pouzivat"
                className="text-sm text-paper/75 transition hover:text-paper"
              >
                Ako to používať
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.2em] text-paper/45 uppercase">
            Služby
          </p>
          <ul className="mt-4 space-y-3">
            {stack.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-paper/75 transition hover:text-paper"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={1.8} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-paper/45 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {year} SPST Knižnica</p>
          <p>Next.js · .NET Gateway · Kafka · Redis</p>
        </div>
      </div>
    </footer>
  );
}
