import { Suspense } from "react";
import { BooksCatalog } from "@/components/catalog/BooksCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export const metadata = {
  title: "Knihy",
};

export default function BooksPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={3} />}>
        <BooksCatalog />
      </Suspense>
    </main>
  );
}
