"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlatCover } from "@/components/landing/FlatCover";
import type { CatalogBook, CatalogCategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type BrowseGenresProps = {
  categories: CatalogCategory[];
  books: CatalogBook[];
};

export function BrowseGenres({ categories, books }: BrowseGenresProps) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const grid = useMemo(() => {
    const matched = books.filter((book) => book.categoryId === active);
    const fillers = books.filter((book) => book.categoryId !== active);
    return [...matched, ...fillers].slice(0, 4);
  }, [active, books]);

  if (categories.length === 0) {
    return null;
  }

  const panelId = "browse-genres-panel";

  return (
    <section
      className="relative z-10 border-t border-rule bg-paper px-4 py-12 sm:px-6 sm:py-14 md:px-8 md:py-20"
      aria-labelledby="browse-genres-heading"
    >
      <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <div className="min-w-0">
          <h2
            id="browse-genres-heading"
            className="font-display text-[clamp(1.75rem,5vw,2.5rem)] tracking-tight text-ink lg:text-4xl"
          >
            Prehliadať
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            žánre
          </h2>

          <div className="relative mt-6 sm:mt-8 lg:mt-0">
            <ul
              className={cn(
                "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]",
                "[mask-image:linear-gradient(to_right,black_calc(100%-1.25rem),transparent)] lg:[mask-image:none]",
                "lg:mt-8 lg:flex-col lg:snap-none lg:space-y-1 lg:overflow-visible lg:pb-0",
              )}
              role="tablist"
              aria-label="Žánre"
            >
              {categories.map((category) => {
                const selected = category.id === active;
                return (
                  <li
                    key={category.id}
                    role="presentation"
                    className="shrink-0 snap-start lg:w-full"
                  >
                    <button
                      type="button"
                      role="tab"
                      id={`genre-tab-${category.id}`}
                      aria-selected={selected}
                      aria-controls={panelId}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(category.id)}
                      className={cn(
                        "whitespace-nowrap rounded-full px-3.5 py-2 text-left text-sm transition lg:w-full lg:rounded-none lg:px-3 lg:py-2.5",
                        selected
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "bg-paper-deep text-muted-foreground hover:bg-rule/40 hover:text-ink lg:bg-transparent lg:hover:bg-paper-deep",
                      )}
                    >
                      {category.name}
                    </button>
                  </li>
                );
              })}
              <li className="shrink-0 snap-start lg:w-full">
                <Link
                  href="/categories"
                  className="mt-0 block whitespace-nowrap rounded-full px-3.5 py-2 text-sm text-ink underline-offset-4 hover:underline lg:mt-2 lg:rounded-none lg:px-3 lg:py-2.5"
                >
                  Všetky →
                </Link>
              </li>
            </ul>
          </div>

          <div
            aria-hidden
            className="mt-10 hidden h-3 w-full max-w-[11rem] grid-cols-4 lg:grid"
          >
            <span className="bg-stair-1" />
            <span className="bg-stair-2" />
            <span className="bg-stair-3" />
            <span className="bg-stair-4" />
          </div>
        </div>

        <ul
          id={panelId}
          role="tabpanel"
          aria-labelledby={active ? `genre-tab-${active}` : undefined}
          className="grid min-w-0 grid-cols-2 gap-3 sm:gap-6 lg:gap-8"
        >
          {grid.map((book) => (
            <li key={book.id} className="min-w-0">
              <Link
                href={`/books/${book.id}`}
                className="group block"
                aria-label={`${book.title}, ${book.author}. ${book.availableCopies} z ${book.totalCopies} exemplárov.`}
              >
                <div
                  className="mx-auto w-[82%] max-w-[11rem] transition duration-300 group-hover:-translate-y-1 sm:w-[70%]"
                  aria-hidden
                >
                  <FlatCover
                    title={book.title}
                    author={book.author}
                    accent={book.accent}
                    secondary={book.secondary}
                  />
                </div>
                <p className="mt-2.5 line-clamp-2 font-display text-sm leading-snug text-ink sm:mt-4 sm:text-lg lg:text-xl">
                  {book.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                  {book.author}
                </p>
                <p className="mt-1.5 text-xs font-semibold text-ink sm:mt-2 sm:text-sm dark:text-accent">
                  {book.availableCopies}/{book.totalCopies} ks
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
