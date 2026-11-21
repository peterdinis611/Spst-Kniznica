import Link from "next/link";
import { ArrowUpRight, Search } from "@/components/icons";
import { AccentGradient165 } from "@/components/styled/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CarouselBook } from "@/lib/catalog";

type PopularShelfProps = {
  books: CarouselBook[];
};

export function PopularShelf({ books }: PopularShelfProps) {
  const items = books.slice(0, 4);

  return (
    <section
      className="relative z-10 border-t border-rule/70 bg-paper"
      aria-labelledby="popular-shelf-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
              Práve populárne
            </p>
            <h2
              id="popular-shelf-heading"
              className="mt-3 max-w-xl font-display text-[clamp(1.85rem,5vw,3rem)] leading-tight text-ink"
            >
              Šťastné čítanie v školskom katalógu
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Vybrané tituly z karuselu. Otvor detail, alebo choď rovno do
              celého katalógu kníh, autorov a kategórií.
            </p>
          </div>

          <form
            action="/books"
            className="relative flex items-center"
            role="search"
            aria-label="Hľadať v katalógu"
          >
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.8}
              aria-hidden
            />
            <Input
              name="q"
              placeholder="Hľadaj názov, autora, vydanie…"
              aria-label="Hľadať názov, autora alebo vydanie"
              className="h-11 rounded-full bg-paper-deep/60 pl-9"
            />
          </form>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            size="lg"
            className="rounded-full"
            render={<Link href="/books" />}
          >
            Začať prehliadanie
            <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
          </Button>
          <Button variant="link" className="justify-start px-0" render={<Link href="#ako-pouzivat" />}>
            Ako to funguje
          </Button>
        </div>

        <ul
          className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-4 sm:gap-5 md:gap-7"
          aria-label="Obľúbené tituly"
        >
          {items.map((book, index) => (
            <li key={book.id} className={`reveal reveal-delay-${(index % 4) + 1}`}>
              <Link href={`/books/${book.id}`} className="group block min-w-0">
                <AccentGradient165
                  $from={book.accent}
                  $to={shade(book.accent, -30)}
                  className="aspect-[2/3] rounded-[0.65rem] shadow-[0_18px_40px_rgba(26,23,20,0.14)] transition duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_28px_55px_rgba(26,23,20,0.18)]"
                >
                  <div className="flex h-full flex-col justify-between p-3 text-[color:var(--paper)] sm:p-4">
                    <p className="line-clamp-3 font-display text-[0.95rem] leading-tight sm:line-clamp-4 sm:text-lg md:text-xl">
                      {book.title}
                    </p>
                    <p className="truncate text-[11px] tracking-[0.04em] opacity-80 sm:text-xs">
                      {book.author}
                    </p>
                  </div>
                </AccentGradient165>
                <p className="mt-2.5 line-clamp-2 font-display text-sm leading-snug text-ink transition group-hover:text-accent-deep sm:mt-3 sm:text-lg dark:group-hover:text-accent">
                  {book.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                  {book.author}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function shade(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const num = Number.parseInt(value, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
