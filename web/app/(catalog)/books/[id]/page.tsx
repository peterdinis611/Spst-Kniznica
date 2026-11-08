import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { Button } from "@/components/ui/button";
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
          accent: "#1F4E8C",
          secondary: "#F6E27A",
        }
      : null;

  if (!book) {
    notFound();
  }

  return (
    <div className="mt-8 grid gap-8 border-t border-rule pt-8 sm:mt-10 sm:gap-10 sm:pt-10 md:grid-cols-[240px_1fr] md:items-start">
      <FlatCover
        title={book.title}
        author={book.author}
        accent={book.accent}
        secondary={book.secondary}
        className="mx-auto w-44 max-w-full sm:w-full"
      />

      <div>
        <p className="inline-block bg-accent px-2 py-1 text-xs font-semibold tracking-[0.16em] text-ink uppercase">
          {book.categoryName ?? "Katalóg"}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] tracking-tight text-ink">
          {book.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {book.author}
        </p>

        <dl className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
          {book.publishedYear ? (
            <div className="border border-rule p-4">
              <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Rok
              </dt>
              <dd className="mt-1 font-display text-2xl text-ink">
                {book.publishedYear}
              </dd>
            </div>
          ) : null}
          <div className="border border-rule p-4">
            <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Exempláre
            </dt>
            <dd className="mt-1 font-display text-2xl text-ink">
              {book.availableCopies}/{book.totalCopies}
            </dd>
          </div>
        </dl>

        {book.description ? (
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {book.description}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/books" className="split-cta group border border-ink bg-paper">
            <span className="px-5 py-3 text-sm font-semibold">Späť do fondu</span>
            <span className="flex items-center bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-ink">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
          <Button
            variant="outline"
            className="rounded-none border-ink"
            render={<Link href="/authors" />}
          >
            Autori
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden />
        Knižný fond
      </Link>

      <Suspense
        fallback={
          <p className="mt-10 text-muted-foreground">Načítavam detail knihy…</p>
        }
      >
        <BookDetailContent params={params} />
      </Suspense>
    </main>
  );
}
