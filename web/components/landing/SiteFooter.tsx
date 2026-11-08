import Link from "next/link";
import { cacheLife } from "next/cache";
import { MOCK_BOOKS } from "@/lib/catalog-mock";

const nav = [
  { href: "/", label: "Domov" },
  { href: "/books", label: "Katalóg" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
] as const;

async function getCurrentYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const year = await getCurrentYear();
  const latest = MOCK_BOOKS.slice(0, 3);

  return (
    <footer className="relative z-10 mt-auto border-t border-rule bg-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr_0.9fr] md:gap-8 md:px-8 md:py-16">
        <div>
          <p className="text-lg font-semibold tracking-tight lowercase">
            spst knižnica<span className="text-accent">.</span>
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

        <div className="bg-accent p-6 text-ink md:self-start">
          <p className="font-display text-2xl leading-tight">
            Pripravení na ďalšiu knihu?
          </p>
          <p className="mt-3 text-sm text-ink/75">
            Otvor katalóg a filtrovať podľa autora alebo kategórie.
          </p>
          <Link
            href="/books"
            className="mt-6 inline-flex border border-ink bg-paper px-4 py-2.5 text-sm font-semibold transition hover:bg-ink hover:text-accent"
          >
            Do katalógu
          </Link>
        </div>
      </div>
    </footer>
  );
}
