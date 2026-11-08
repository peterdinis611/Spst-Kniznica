import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { apiGet } from "@/lib/api";
import { DEMO_BOOKS } from "@/lib/books";
import type { BookListItem, PagedResult } from "@/lib/types";

export const metadata = {
  title: "Knihy",
};

async function BooksList() {
  let books: BookListItem[] = [];
  try {
    const result = await apiGet<PagedResult<BookListItem>>("/api/books?page=1&pageSize=24");
    books = result.items ?? [];
  } catch {
    books = DEMO_BOOKS.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      totalCopies: 1,
      availableCopies: 1,
      categoryName: "Ukážka",
    }));
  }

  return (
    <ul className="mt-10 divide-y divide-rule/80">
      {books.map((book) => (
        <li key={book.id}>
          <Link
            href={`/books/${book.id}`}
            className="group flex flex-col gap-1 py-5 transition sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="font-display text-2xl text-ink transition group-hover:text-accent">
              {book.title}
            </span>
            <span className="text-sm text-muted">{book.author}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BooksPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 md:px-8">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">Katalóg</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Knihy</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Prehľad titulov cez Gateway. Klikni na knihu pre detail.
        </p>

        <Suspense
          fallback={<p className="mt-10 text-muted">Načítavam katalóg…</p>}
        >
          <BooksList />
        </Suspense>
      </div>
    </main>
  );
}
