import Link from "next/link";
import type { CarouselBook } from "@/lib/types";

type PopularShelfProps = {
  books: CarouselBook[];
};

export function PopularShelf({ books }: PopularShelfProps) {
  const items = books.slice(0, 4);

  return (
    <section className="relative z-10 border-t border-rule/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid items-end gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
              Popular now
            </p>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight text-ink md:text-5xl">
              Šťastné čítanie v školskom katalógu
            </h2>
            <p className="mt-4 max-w-lg text-muted">
              Vybrané tituly z karuselu. Otvor detail, alebo choď rovno do
              celého katalógu kníh, autorov a kategórií.
            </p>
          </div>

          <form
            action="/books"
            className="flex items-center gap-3 rounded-full border border-rule bg-paper-deep/60 px-4 py-3"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              placeholder="Hľadaj názov, autora, vydanie…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
            />
          </form>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition hover:bg-accent"
          >
            Začať prehliadanie
            <span aria-hidden>↗</span>
          </Link>
          <Link
            href="#ako-pouzivat"
            className="text-sm text-muted underline-offset-4 transition hover:text-ink hover:underline"
          >
            Ako to funguje
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4 md:gap-7">
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
                <p className="mt-3 font-display text-lg text-ink transition group-hover:text-accent">
                  {book.title}
                </p>
                <p className="text-sm text-muted">{book.author}</p>
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
