import { Suspense } from "react";
import { CategoriesCatalog } from "@/components/catalog/CategoriesCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchCategoriesAction } from "@/lib/actions/categories";

export const metadata = {
  title: "Kategórie",
};

async function CategoriesPageContent() {
  const result = await searchCategoriesAction({ page: 1, pageSize: 50 });

  return (
    <CategoriesCatalog initialCategories={result?.data?.items ?? []} />
  );
}

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={3} />}>
        <CategoriesPageContent />
      </Suspense>
    </main>
  );
}
