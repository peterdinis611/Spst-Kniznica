import Link from "next/link";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { LibraryMap } from "@/components/landing/LibraryMap";
import { searchBooksAction } from "@/lib/catalog/actions";
import { siteConfig } from "@/lib/site";

const nav = [
  { href: "/", label: "Domov" },
  { href: "/books", label: "Katalóg" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
  { href: "/bookings", label: "Výpožičky" },
] as const;

async function getCurrentYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  await connection();
  const year = await getCurrentYear();
  const booksResult = await searchBooksAction({ page: 1, pageSize: 3 });
  const latest = booksResult?.data?.items ?? [];

  return (
    <footer className="relative z-10 mt-auto border-t border-rule bg-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr_0.9fr] md:gap-8 md:px-8 md:py-16">
        <div>
          <p className="text-lg font-semibold tracking-tight">
            SPST Knižnica<span className="text-accent">.</span>
          </p>
          <ul className="mt-6 space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-muted-foreground">
            © {year} SPST Knižnica
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Novinky z fondu
          </p>
          <ul className="mt-5 space-y-4">
            {latest.map((book) => (
              <li key={book.id} className="flex gap-3">
                <span
                  className="mt-0.5 size-10 shrink-0"
                  style={{ background: book.accent }}
                  aria-hidden
                />
                <Link href={`/books/${book.id}`} className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6 md:self-start">
          <div className="border border-rule p-4 dark:border-white/10">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Kde nás nájdeš · OSM
            </p>
            <p className="mt-2 text-sm text-ink">{siteConfig.address}</p>
            <div className="mt-3">
              <LibraryMap />
            </div>
          </div>
          <div className="on-accent bg-accent p-6 text-accent-foreground">
            <p className="font-display text-2xl leading-tight text-accent-foreground">
              Pripravení na ďalšiu knihu?
            </p>
            <p className="mt-3 text-sm text-accent-foreground/75">
              Otvor fond, alebo choď rovno na výpožičný pult.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/books"
                className="inline-flex border border-accent-foreground/30 bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-paper hover:text-ink"
              >
                Do katalógu
              </Link>
              <Link
                href="/bookings"
                className="inline-flex border border-accent-foreground/50 px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-foreground hover:text-accent"
              >
                Na pult
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
