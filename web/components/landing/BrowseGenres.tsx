"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlatCover } from "@/components/landing/FlatCover";
import type { CatalogBook, CatalogCategory } from "@/lib/catalog";

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

  return (
    <section className="relative z-10 border-t border-rule bg-paper px-4 py-14 sm:px-6 md:px-8 md:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[14rem_1fr] md:gap-12">
        <div>
          <h2 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
            Prehliadať
            <br />
            žánre
          </h2>
          <ul className="mt-8 space-y-1">
            {categories.map((category) => {
              const selected = category.id === active;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => setActive(category.id)}
                    className={`w-full px-3 py-2.5 text-left text-sm transition ${
                      selected
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-paper-deep hover:text-ink"
                    }`}
                  >
                    {category.name}
                  </button>
                </li>
              );
            })}
            <li>
              <Link
                href="/categories"
                className="mt-2 block px-3 py-2.5 text-sm text-ink underline-offset-4 hover:underline"
              >
                Všetky kategórie →
              </Link>
            </li>
          </ul>

          <div
            aria-hidden
            className="mt-10 hidden h-3 w-full max-w-[11rem] grid-cols-4 md:grid"
          >
            <span className="bg-stair-1" />
            <span className="bg-stair-2" />
            <span className="bg-stair-3" />
            <span className="bg-stair-4" />
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          {grid.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`} className="group block">
                <div className="mx-auto w-[78%] max-w-[11rem] transition duration-300 group-hover:-translate-y-1 sm:w-[70%]">
                  <FlatCover
                    title={book.title}
                    author={book.author}
                    accent={book.accent}
                    secondary={book.secondary}
                  />
                </div>
                <p className="mt-4 font-display text-lg leading-tight text-ink sm:text-xl">
                  {book.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
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
