import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { BooksCatalog } from "@/components/catalog/BooksCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import {
  searchAuthorsAction,
  searchBooksAction,
  searchCategoriesAction,
} from "@/lib/catalog/actions";
import { shelfZonesFromShelfCodes } from "@/lib/catalog/catalog-url";
import {
  BOOKS_FILTER_QUERY_KEYS,
  catalogSearchParamsAreFiltered,
} from "@/lib/seo/catalog-query-index";
import { buildPageMetadata } from "@/lib/seo/metadata";

type BooksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: BooksPageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = catalogSearchParamsAreFiltered(
    params,
    BOOKS_FILTER_QUERY_KEYS,
  );

  return buildPageMetadata({
    title: "Katalóg kníh",
    description:
      "Prehliadajte školský fond SPST — vyhľadávanie podľa názvu, autora a kategórie.",
    path: "/books",
    keywords: ["katalóg kníh", "vyhľadávanie kníh"],
    noIndex: filtered,
  });
}

async function BooksPageContent() {
  await connection();
  const [booksResult, categoriesResult, authorsResult] = await Promise.all([
    searchBooksAction({ page: 1, pageSize: 24 }),
    searchCategoriesAction({ page: 1, pageSize: 40 }),
    searchAuthorsAction({ page: 1, pageSize: 40 }),
  ]);

  const shelfZones = shelfZonesFromShelfCodes(
    (booksResult?.data?.items ?? []).map((book) => book.shelfLocation),
  );

  return (
    <BooksCatalog
      initialBooks={booksResult?.data?.items ?? []}
      initialCategories={categoriesResult?.data?.items ?? []}
      initialAuthors={authorsResult?.data?.items ?? []}
      shelfZones={shelfZones}
    />
  );
}

export default function BooksPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={6} variant="books" />}>
        <BooksPageContent />
      </Suspense>
    </div>
  );
}
