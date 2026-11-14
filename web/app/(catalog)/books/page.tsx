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
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Katalóg kníh",
  description:
    "Prehliadajte školský fond SPST — vyhľadávanie podľa názvu, autora a kategórie.",
  path: "/books",
  keywords: ["katalóg kníh", "vyhľadávanie kníh"],
});

async function BooksPageContent() {
  await connection();
  const [booksResult, categoriesResult, authorsResult, shelvesProbe] =
    await Promise.all([
      searchBooksAction({ page: 1, pageSize: 50 }),
      searchCategoriesAction({ page: 1, pageSize: 50 }),
      searchAuthorsAction({ page: 1, pageSize: 80 }),
      searchBooksAction({ page: 1, pageSize: 100 }),
    ]);

  const shelfZones = shelfZonesFromShelfCodes(
    (shelvesProbe?.data?.items ?? []).map((book) => book.shelfLocation),
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={3} />}>
        <BooksPageContent />
      </Suspense>
    </main>
  );
}
