import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Settings2 } from "lucide-react";
import { BookCover } from "@/components/catalog/BookCover";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import {
  getRecommendedBooks,
  MOCK_CATEGORIES,
  searchMockBooks,
} from "@/lib/catalog-mock";

export const metadata = {
  title: "Knihy",
};

type BooksPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

async function BooksResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const results = searchMockBooks(q, category);
  const activeCategory = MOCK_CATEGORIES.find((item) => item.id === category);

  return (
    <section className="mt-12 pb-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            {q || category ? "Výsledky hľadania" : "Celý katalóg"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {activeCategory
              ? `Kategória: ${activeCategory.name}`
              : "Mock dáta pre návrh UI"}
            {q ? ` · „${q}“` : ""}
          </p>
        </div>
        <p className="text-sm text-muted">{results.length} titulov</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((book) => (
          <li key={book.id}>
            <Link
              href={`/books/${book.id}`}
              className="flex gap-4 rounded-[1.4rem] border border-rule/70 bg-paper p-3 transition hover:shadow-[0_14px_30px_rgba(26,23,20,0.08)]"
            >
              <BookCover
                title={book.title}
                accent={book.accent}
                secondary={book.secondary}
                className="h-28 w-[4.6rem] shrink-0"
              />
              <div className="min-w-0 py-1">
                <p className="font-display text-xl text-ink">{book.title}</p>
                <p className="mt-1 text-sm text-muted">{book.author}</p>
                <p className="mt-3 text-xs tracking-[0.12em] text-accent uppercase">
                  {book.categoryName} · {book.year}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {book.availableCopies}/{book.totalCopies} dostupných
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function BooksSearchBar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  return (
    <CatalogTopBar title="Objaviť" defaultQuery={q} defaultCategory={category} />
  );
}

export default function BooksPage({ searchParams }: BooksPageProps) {
  const recommended = getRecommendedBooks();

  return (
    <main className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <Suspense
        fallback={
          <h1 className="font-display text-4xl text-ink md:text-5xl">Objaviť</h1>
        }
      >
        <BooksSearchBar searchParams={searchParams} />
      </Suspense>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            Odporúčané knihy
          </h2>
          <Link
            href="/books"
            className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink"
          >
            Zobraziť všetko
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-3">
          {recommended.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group w-[9.5rem] shrink-0 sm:w-[11rem]"
            >
              <BookCover
                title={book.title}
                author={book.author}
                accent={book.accent}
                secondary={book.secondary}
                className="aspect-[2/3] transition duration-300 group-hover:-translate-y-1"
              />
              <p className="mt-3 line-clamp-2 font-display text-base text-ink">
                {book.title}
              </p>
              <p className="text-xs text-muted">{book.author}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            Kategórie kníh
          </h2>
          <Link
            href="/categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-rule/80 bg-paper text-muted transition hover:text-ink"
            aria-label="Správa kategórií"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_CATEGORIES.map((item) => (
            <li key={item.id}>
              <Link
                href={`/books?category=${item.id}`}
                className="group block rounded-[1.4rem] border border-rule/70 bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(26,23,20,0.08)]"
              >
                <div className="flex h-28 items-center justify-center rounded-[1rem] bg-paper-deep/80">
                  <BookCover
                    title={item.name}
                    accent={item.accent}
                    secondary={item.secondary}
                    className="h-[5.5rem] w-[3.7rem] shadow-[0_10px_20px_rgba(26,23,20,0.12)] transition group-hover:-rotate-3"
                  />
                </div>
                <p className="mt-4 font-display text-lg text-ink">{item.name}</p>
                <p className="text-xs text-muted">{item.bookCount} kníh</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Suspense
        fallback={<p className="mt-12 text-muted">Načítavam výsledky…</p>}
      >
        <BooksResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
