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

          <ul
            className={cn(
              "mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "sm:mt-8 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0",
            )}
            role="tablist"
            aria-label="Žánre"
          >
            {categories.map((category) => {
              const selected = category.id === active;
              return (
                <li key={category.id} role="presentation" className="shrink-0 lg:w-full">
                  <button
                    type="button"
                    role="tab"
                    id={`genre-tab-${category.id}`}
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(category.id)}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left text-sm transition lg:w-full",
                      selected
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-paper-deep hover:text-ink",
                    )}
                  >
                    {category.name}
                  </button>
                </li>
              );
            })}
            <li className="shrink-0 lg:w-full">
              <Link
                href="/categories"
                className="mt-0 block whitespace-nowrap px-3 py-2.5 text-sm text-ink underline-offset-4 hover:underline lg:mt-2"
              >
                Všetky kategórie →
              </Link>
            </li>
          </ul>

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
          className="grid min-w-0 grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
        >
          {grid.map((book) => (
            <li key={book.id} className="min-w-0">
              <Link
                href={`/books/${book.id}`}
                className="group block"
                aria-label={`${book.title}, ${book.author}. ${book.availableCopies} z ${book.totalCopies} exemplárov.`}
              >
                <div
                  className="mx-auto w-[78%] max-w-[11rem] transition duration-300 group-hover:-translate-y-1 sm:w-[70%]"
                  aria-hidden
                >
                  <FlatCover
                    title={book.title}
                    author={book.author}
                    accent={book.accent}
                    secondary={book.secondary}
                  />
                </div>
                <p className="mt-3 font-display text-base leading-tight text-ink sm:mt-4 sm:text-lg lg:text-xl">
                  {book.title}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {book.author}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink dark:text-accent">
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
