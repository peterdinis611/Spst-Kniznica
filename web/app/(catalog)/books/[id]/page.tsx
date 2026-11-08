import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookCover } from "@/components/catalog/BookCover";
import { MOCK_BOOKS } from "@/lib/catalog-mock";
import { fetchBookDetail } from "@/lib/books";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Detail knihy",
};

async function BookDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mock = MOCK_BOOKS.find((book) => book.id === id);
  const apiBook = mock ? null : await fetchBookDetail(id);
  const book = mock
    ? {
        id: mock.id,
        title: mock.title,
        author: mock.author,
        categoryName: mock.categoryName,
        publishedYear: mock.year,
        availableCopies: mock.availableCopies,
        totalCopies: mock.totalCopies,
        description:
          "Mock detail pre návrh katalógu. Po napojení API sa zobrazia skutočné dáta z BookService.",
        accent: mock.accent,
        secondary: mock.secondary,
      }
    : apiBook
      ? {
          ...apiBook,
          accent: "#8B5A3C",
          secondary: "#F2E6D8",
        }
      : null;

  if (!book) {
    notFound();
  }

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
      <BookCover
        title={book.title}
        author={book.author}
        accent={book.accent}
        secondary={book.secondary}
        className="aspect-[2/3] w-full max-w-[220px]"
      />

      <div className="rounded-[1.6rem] border border-rule/70 bg-paper p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">
          {book.categoryName ?? "Katalóg"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {book.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{book.author}</p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {book.publishedYear ? (
            <div className="border-t border-rule/80 pt-3">
              <dt className="text-[11px] tracking-[0.16em] text-muted uppercase">
                Rok
              </dt>
              <dd className="mt-1 text-ink">{book.publishedYear}</dd>
            </div>
          ) : null}
          <div className="border-t border-rule/80 pt-3">
            <dt className="text-[11px] tracking-[0.16em] text-muted uppercase">
              Exempláre
            </dt>
            <dd className="mt-1 text-ink">
              {book.availableCopies} / {book.totalCopies} dostupných
            </dd>
          </div>
        </dl>

        {book.description ? (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted">
            {book.description}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/books"
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition hover:bg-accent"
          >
            Ďalšie knihy
          </Link>
          <Link
            href="/authors"
            className="rounded-full border border-rule px-5 py-2.5 text-sm text-ink transition hover:border-accent"
          >
            Autori
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <main className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Späť do katalógu
      </Link>

      <Suspense
        fallback={<p className="mt-10 text-muted">Načítavam detail knihy…</p>}
      >
        <BookDetailContent params={params} />
      </Suspense>
    </main>
  );
}
