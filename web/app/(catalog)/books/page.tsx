import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { BooksCatalog } from "@/components/catalog/BooksCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import {
  searchBooksAction,
  searchCategoriesAction,
} from "@/lib/catalog/actions";

export const metadata: Metadata = {
  title: "Katalóg kníh",
  description:
    "Prehliadajte školský fond SPST — vyhľadávanie podľa názvu, autora a kategórie.",
  alternates: { canonical: "/books" },
  openGraph: {
    title: "Katalóg kníh",
    description:
      "Prehliadajte školský fond SPST — vyhľadávanie podľa názvu, autora a kategórie.",
    url: "/books",
  },
};

async function BooksPageContent() {
  await connection();
  const [booksResult, categoriesResult] = await Promise.all([
    searchBooksAction({ page: 1, pageSize: 50 }),
    searchCategoriesAction({ page: 1, pageSize: 50 }),
  ]);

  return (
    <BooksCatalog
      initialBooks={booksResult?.data?.items ?? []}
      initialCategories={categoriesResult?.data?.items ?? []}
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
