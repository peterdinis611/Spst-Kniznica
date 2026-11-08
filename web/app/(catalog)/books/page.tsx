import { Suspense } from "react";
import Link from "next/link";
import { FlatCover } from "@/components/landing/FlatCover";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { MOCK_CATEGORIES, searchMockBooks } from "@/lib/catalog-mock";

export const metadata = {
  title: "Knihy",
};

type BooksPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

async function BooksBody({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const results = searchMockBooks(q, category);
  const activeCategory = MOCK_CATEGORIES.find((item) => item.id === category);

  return (
    <>
      <CatalogTopBar
        title="Knižný fond"
        lead="Obchodný prehľad titulov — filter podľa názvu, autora alebo kategórie. Neskôr napojíme na BookService."
        defaultQuery={q}
        defaultCategory={category}
      />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/books"
          className={`shrink-0 px-3 py-2 text-sm font-medium transition ${
            !category
              ? "bg-accent text-ink"
              : "border border-rule text-muted-foreground hover:border-ink hover:text-ink"
          }`}
        >
          Všetky
        </Link>
        {MOCK_CATEGORIES.map((item) => (
          <Link
            key={item.id}
            href={`/books?category=${item.id}`}
            className={`shrink-0 px-3 py-2 text-sm font-medium transition ${
              category === item.id
                ? "bg-accent text-ink"
                : "border border-rule text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4 border-b border-rule pb-3">
        <p className="text-sm text-muted-foreground">
          {activeCategory ? activeCategory.name : "Celý fond"}
          {q ? ` · „${q}“` : ""}
        </p>
        <p className="font-display text-xl text-ink">{results.length}</p>
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Nič sa nenašlo. Skús iný filter.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 pb-16 pt-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:gap-x-8">
          {results.map((book, index) => (
            <li key={book.id} className="reveal" style={{ animationDelay: `${(index % 8) * 0.05}s` }}>
              <Link href={`/books/${book.id}`} className="group block">
                <div className="mx-auto w-[88%] max-w-[11rem] transition duration-300 group-hover:-translate-y-1.5">
                  <FlatCover
                    title={book.title}
                    author={book.author}
                    accent={book.accent}
                    secondary={book.secondary}
                  />
                </div>
                <p className="mt-4 font-display text-lg leading-tight text-ink transition group-hover:underline sm:text-xl">
                  {book.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="tracking-[0.08em] text-muted-foreground uppercase">
                    {book.categoryName}
                  </span>
                  <span className="font-semibold text-ink">
                    {book.availableCopies}/{book.totalCopies} ks
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function BooksPage({ searchParams }: BooksPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<p className="text-muted-foreground">Načítavam knižný fond…</p>}>
        <BooksBody searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
