import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BookCard } from "@/components/catalog/BookCard";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildBooksCatalogHref } from "@/lib/catalog/catalog-url";
import {
  getCategoryAction,
  searchBooksAction,
} from "@/lib/catalog/actions";

type CategoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CategoryDetailPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const result = await getCategoryAction({ id });
  const category = result?.data?.category;

  if (!category) {
    return {
      title: "Kategória nenájdená",
      robots: { index: false, follow: false },
    };
  }

  const description =
    category.description !== "Bez popisu."
      ? category.description
      : `${category.name} — tematická rada vo fonde SPST Knižnice.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `/categories/${category.id}` },
    openGraph: {
      title: category.name,
      description,
      url: `/categories/${category.id}`,
    },
  };
}

async function CategoryDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [categoryResult, booksResult] = await Promise.all([
    getCategoryAction({ id }),
    searchBooksAction({ categoryId: id, page: 1, pageSize: 50 }),
  ]);

  const category = categoryResult?.data?.category;
  if (!category) {
    notFound();
  }

  const books = booksResult?.data?.items ?? [];
  const booksHref = buildBooksCatalogHref({ category: category.id });

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Katalóg", href: "/books" },
          { label: "Kategórie", href: "/categories" },
          { label: category.name },
        ]}
      />

      <div className="mt-2 border-t border-rule pt-8 sm:mt-4 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: category.accent }}
            aria-hidden
          />
          <Badge className="rounded-none border border-sage/30 bg-mint/50 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-sage uppercase hover:bg-mint/50 dark:border-sage/35 dark:bg-paper-deep">
            Kategória
          </Badge>
        </div>

        <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.2rem,7vw,3.75rem)] leading-[1.02] tracking-tight text-ink">
          {category.name}
        </h1>

        <dl className="mt-8 flex max-w-xl flex-wrap gap-x-10 gap-y-4 border-y border-rule py-5 dark:border-white/10">
          <div>
            <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Tituly vo fonde
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
              <span className="text-sage">{books.length}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-8 max-w-2xl border-l-2 border-sage/50 pl-5">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
            {category.description}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            className="group h-auto gap-0 overflow-hidden rounded-full border border-ink bg-paper p-0 text-ink hover:bg-paper"
            render={<Link href={booksHref} />}
          >
            <span className="px-5 py-3 text-sm font-semibold">
              Filtrovať katalóg
            </span>
            <span className="flex items-center self-stretch bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-ink"
            render={<Link href="/categories" />}
          >
            Všetky kategórie
          </Button>
        </div>
      </div>

      <section
        className="mt-14 border-t border-rule pt-10 sm:mt-16 sm:pt-12 dark:border-white/10"
        aria-labelledby="category-books-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Fond
            </p>
            <h2
              id="category-books-heading"
              className="mt-2 font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-tight tracking-tight text-ink"
            >
              Tituly v kategórii
            </h2>
          </div>
          <Badge
            variant="secondary"
            className="h-auto rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {books.length}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {books.length === 1 ? "titul" : "titulov"}
            </span>
          </Badge>
        </div>

        {books.length === 0 ? (
          <CatalogEmpty
            title="Zatiaľ bez kníh"
            description="V tejto kategórii zatiaľ nie sú priradené tituly."
            resetHref="/books"
            resetLabel="Do katalógu"
          />
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 pb-16 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
            {books.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={2} />}>
        <CategoryDetailContent params={params} />
      </Suspense>
    </main>
  );
}
