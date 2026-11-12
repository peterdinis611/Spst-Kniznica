import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CarouselBook } from "@/lib/catalog";

type PopularShelfProps = {
  books: CarouselBook[];
};

export function PopularShelf({ books }: PopularShelfProps) {
  const items = books.slice(0, 4);

  return (
    <section className="relative z-10 border-t border-rule/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
              Popular now
            </p>
            <h2 className="mt-3 max-w-xl font-display text-[clamp(1.85rem,5vw,3rem)] leading-tight text-ink">
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
          >
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.8}
              aria-hidden
            />
            <Input
              name="q"
              placeholder="Hľadaj názov, autora, vydanie…"
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

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 md:gap-7">
          {items.map((book, index) => (
            <li key={book.id} className={`reveal reveal-delay-${(index % 4) + 1}`}>
              <Link href={`/books/${book.id}`} className="group block">
                <div
                  className="aspect-[2/3] rounded-[0.65rem] shadow-[0_18px_40px_rgba(26,23,20,0.14)] transition duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_28px_55px_rgba(26,23,20,0.18)]"
                  style={{
                    background: `linear-gradient(165deg, ${book.accent} 0%, ${shade(book.accent, -30)} 100%)`,
                  }}
                >
                  <div className="flex h-full flex-col justify-between p-4 text-[color:var(--paper)]">
                    <p className="font-display text-lg leading-tight md:text-xl">
                      {book.title}
                    </p>
                    <p className="text-xs tracking-[0.04em] opacity-80">
                      {book.author}
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-display text-lg text-ink transition group-hover:text-accent-deep dark:group-hover:text-accent">
                  {book.title}
                </p>
                <p className="text-sm text-muted-foreground">{book.author}</p>
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
