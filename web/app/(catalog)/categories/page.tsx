import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CategoriesCatalog } from "@/components/catalog/CategoriesCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchCategoriesAction } from "@/lib/catalog/actions";

export const metadata: Metadata = {
  title: "Kategórie",
  description:
    "Tematické rady školského fondu — elektrotechnika, strojárstvo a ďalšie odbory.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Kategórie",
    description:
      "Tematické rady školského fondu — elektrotechnika, strojárstvo a ďalšie odbory.",
    url: "/categories",
  },
};

async function CategoriesPageContent() {
  await connection();
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
