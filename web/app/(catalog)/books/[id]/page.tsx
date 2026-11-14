import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthorMoreBooks } from "@/components/catalog/AuthorMoreBooks";
import { BookOpenTickets } from "@/components/catalog/BookOpenTickets";
import { ReserveSlip } from "@/components/catalog/ReserveSlip";
import { getBookAction } from "@/lib/catalog/actions";
import { bookJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildBookMetadata } from "@/lib/seo/metadata";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const result = await getBookAction({ id });
  const book = result?.data?.book;

  if (!book) {
    return {
      title: "Kniha nenájdená",
      robots: { index: false, follow: false },
    };
  }

  const description =
    book.description?.trim() ||
    `${book.title} od ${book.author} vo fonde SPST Knižnice.`;

  return buildBookMetadata({
    title: book.title,
    description,
    path: `/books/${book.id}`,
    authors: [book.author],
    isbn: book.isbn,
    releaseDate: book.year ? String(book.year) : null,
    keywords: [
      book.title,
      book.author,
      book.categoryName ?? "",
      book.isbn ?? "",
    ].filter(Boolean),
  });
}

async function BookDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const result = await getBookAction({ id });
  const book = result?.data?.book;

  if (!book) {
    notFound();
  }

  const available = book.availableCopies > 0;

  return (
    <>
      <JsonLd
        data={[
          bookJsonLd({
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description,
            isbn: book.isbn,
            publishedYear: book.year,
            language: book.language,
            coverUrl: book.coverUrl,
          }),
          breadcrumbJsonLd([
            { name: "Domov", path: "/" },
            { name: "Knihy", path: "/books" },
            { name: book.title, path: `/books/${book.id}` },
          ]),
        ]}
      />
      <CatalogBreadcrumb
        items={[
          { label: "Katalóg", href: "/books" },
          { label: "Knihy", href: "/books" },
          { label: book.title },
        ]}
      />

      <div className="mt-2 grid gap-10 border-t border-rule pt-8 sm:mt-4 sm:pt-10 lg:grid-cols-[minmax(10rem,13.5rem)_1fr] lg:items-start lg:gap-14">
        <div className="lg:sticky lg:top-8">
          <FlatCover
            title={book.title}
            author={book.author}
            accent={book.accent}
            secondary={book.secondary}
            className="mx-auto w-48 max-w-full shadow-[0_32px_64px_-44px_rgba(14,26,36,0.45)] sm:w-52 lg:mx-0"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {book.categoryId ? (
              <Badge
                className="rounded-none border border-sage/30 bg-mint/50 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-sage uppercase hover:bg-mint/50 dark:border-sage/35 dark:bg-paper-deep"
                render={<Link href={`/categories/${book.categoryId}`} />}
              >
                {book.categoryName ?? "Katalóg"}
              </Badge>
            ) : (
              <Badge className="rounded-none border border-sage/30 bg-mint/50 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-sage uppercase hover:bg-mint/50 dark:border-sage/35 dark:bg-paper-deep">
                {book.categoryName ?? "Katalóg"}
              </Badge>
            )}
            <Badge
              variant={available ? "secondary" : "outline"}
              className="rounded-none border border-transparent px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase"
            >
              {available ? "Dostupné" : "Nedostupné"}
            </Badge>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] tracking-tight text-ink">
            {book.title}
          </h1>
          <p className="mt-2 font-display text-lg text-sage sm:text-xl">
            {book.authorId ? (
              <Link
                href={`/authors/${book.authorId}`}
                className="transition hover:text-ink hover:underline hover:underline-offset-4"
              >
                {book.author}
              </Link>
            ) : (
              book.author
            )}
          </p>

          <dl className="mt-8 flex max-w-xl flex-wrap gap-x-10 gap-y-4 border-y border-rule py-5 dark:border-white/10">
            {book.year ? (
              <div>
                <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                  Rok
                </dt>
                <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
                  {book.year}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                Exempláre
              </dt>
              <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
                <span className="text-sage">{book.availableCopies}</span>
                <span className="text-muted-foreground"> / {book.totalCopies}</span>
              </dd>
            </div>
          </dl>

          {book.description ? (
            <div className="mt-8 max-w-2xl border-l-2 border-sage/50 pl-5">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
                {book.description}
              </p>
            </div>
          ) : null}

          <ReserveSlip
            bookId={book.id}
            title={book.title}
            available={available}
          />

          <Suspense fallback={null}>
            <BookOpenTickets bookId={book.id} />
          </Suspense>

          <Separator className="my-8 max-w-xl" />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="group h-auto gap-0 overflow-hidden rounded-full border border-ink bg-paper p-0 text-ink hover:bg-paper"
              render={<Link href="/books" />}
            >
              <span className="px-5 py-3 text-sm font-semibold">
                Späť do fondu
              </span>
              <span className="flex items-center self-stretch bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-ink"
              render={<Link href="/authors" />}
            >
              Autori
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-ink"
              render={<Link href="/categories" />}
            >
              Kategórie
            </Button>
          </div>
        </div>
      </div>

      <Suspense fallback={<CatalogSkeleton rows={1} />}>
        <AuthorMoreBooks
          authorId={book.authorId}
          authorName={book.author}
          excludeBookId={book.id}
        />
      </Suspense>
    </>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={2} />}>
        <BookDetailContent params={params} />
      </Suspense>
    </main>
  );
}
