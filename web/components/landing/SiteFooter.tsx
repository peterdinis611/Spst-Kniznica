import Link from "next/link";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { ArrowUpRight, MapPin } from "@/components/icons";
import { LibraryMap } from "@/components/landing/LibraryMap";
import { AccentFill } from "@/components/styled/primitives";
import { searchBooksAction } from "@/lib/catalog/actions";
import { siteConfig } from "@/lib/site";

const nav = [
  { href: "/", label: "Domov" },
  { href: "/books", label: "Katalóg" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
  { href: "/bookings", label: "Výpožičky" },
  { href: "/library", label: "Moja knižnica" },
] as const;

const secondary = [
  { href: "/#faq", label: "Otázky a odpovede" },
  { href: "/#ako-pouzivat", label: "Ako to používať" },
  { href: "/login", label: "Prihlásenie" },
] as const;

async function getCurrentYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  await connection();
  const year = await getCurrentYear();
  const booksResult = await searchBooksAction({ page: 1, pageSize: 4 });
  const latest = booksResult?.data?.items ?? [];

  return (
    <footer
      className="relative z-10 mt-auto overflow-hidden border-t border-rule bg-paper-deep/40 dark:bg-paper"
      role="contentinfo"
      aria-label="Pätička SPST Knižnice"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-sage/10 blur-3xl dark:bg-sage/5"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 md:px-8 md:pt-16">
        <div className="flex flex-col gap-6 border-b border-rule pb-10 dark:border-white/10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
              {siteConfig.city} · školský fond
            </p>
            <p className="mt-3 font-display text-[clamp(2.2rem,6vw,3.5rem)] leading-[0.95] tracking-tight text-ink">
              SPST Knižnica
              <span className="text-accent" aria-hidden>
                .
              </span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Katalóg Strednej priemyselnej školy technickej — knihy, autori a
              výpožičný pult na jednom mieste.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent hover:text-accent-foreground"
            >
              Do katalógu
              <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
            </Link>
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper dark:border-white/25"
            >
              Výpožičný pult
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-12 md:grid-cols-[0.9fr_1fr_1.15fr] md:gap-10 md:py-14">
          <div className="space-y-8">
            <nav aria-label="Pätičková navigácia">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                Navigácia
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink/80 transition hover:text-sage"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Ďalšie odkazy">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                Pomoc
              </p>
              <ul className="mt-4 space-y-2.5">
                {secondary.map((item) => (
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
            </nav>
          </div>

          <section aria-labelledby="footer-latest-heading">
            <h2
              id="footer-latest-heading"
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
            >
              Novinky z fondu
            </h2>
            <ul className="mt-5 space-y-0 divide-y divide-rule dark:divide-white/10">
              {latest.length === 0 ? (
                <li className="py-3 text-sm text-muted-foreground">
                  Momentálne bez tipov z fondu.
                </li>
              ) : (
                latest.map((book, index) => (
                  <li key={book.id}>
                    <Link
                      href={`/books/${book.id}`}
                      className="group flex gap-3 py-3.5 transition"
                      aria-label={`${book.title}, ${book.author}`}
                    >
                      <AccentFill
                        $color={book.accent}
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center font-mono text-[10px] text-white"
                        aria-hidden
                      >
                        {String(index + 1).padStart(2, "0")}
                      </AccentFill>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink group-hover:text-sage">
                          {book.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {book.author}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section
            className="border border-rule bg-paper p-5 dark:border-white/10 dark:bg-paper-deep/60"
            aria-labelledby="footer-map-heading"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-sage/30 bg-mint/40 text-sage dark:bg-sage/15"
                aria-hidden
              >
                <MapPin className="size-3.5" strokeWidth={1.8} />
              </span>
              <div>
                <h2
                  id="footer-map-heading"
                  className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
                >
                  Kde nás nájdeš · OSM
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-snug text-ink">
                  {siteConfig.addressShort}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {siteConfig.address}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <LibraryMap query={siteConfig.geocodeQuery} />
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-rule pt-4 text-xs dark:border-white/10 sm:grid-cols-2">
              <div>
                <dt className="font-mono tracking-[0.14em] text-muted-foreground uppercase">
                  Telefón
                </dt>
                <dd className="mt-1">
                  <Link
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="text-ink hover:text-sage"
                  >
                    {siteConfig.phone}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-mono tracking-[0.14em] text-muted-foreground uppercase">
                  E-mail
                </dt>
                <dd className="mt-1">
                  <Link
                    href={`mailto:${siteConfig.email}`}
                    className="text-ink hover:text-sage"
                  >
                    {siteConfig.email}
                  </Link>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-rule py-6 text-xs text-muted-foreground dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}
            <span className="mx-2 text-rule" aria-hidden>
              ·
            </span>
            {siteConfig.city}
          </p>
          <Link
            href={siteConfig.schoolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-ink"
          >
            spsbj.sk
            <span className="sr-only"> (nové okno)</span>
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </footer>
  );
}
