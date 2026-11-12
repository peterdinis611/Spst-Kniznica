import { Suspense } from "react";
import { BooksCatalog } from "@/components/catalog/BooksCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchBooksAction } from "@/lib/catalog/actions";
import { searchCategoriesAction } from "@/lib/catalog/actions";

export const metadata = {
  title: "Knihy",
};

async function BooksPageContent() {
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
