import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CategoriesCatalog } from "@/components/catalog/CategoriesCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchCategoriesAction } from "@/lib/catalog/actions";
import {
  CATEGORIES_FILTER_QUERY_KEYS,
  catalogSearchParamsAreFiltered,
} from "@/lib/seo/catalog-query-index";
import { buildPageMetadata } from "@/lib/seo/metadata";

type CategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: CategoriesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = catalogSearchParamsAreFiltered(
    params,
    CATEGORIES_FILTER_QUERY_KEYS,
  );

  return buildPageMetadata({
    title: "Kategórie",
    description:
      "Tematické rady školského fondu — elektrotechnika, strojárstvo a ďalšie odbory.",
    path: "/categories",
    keywords: ["kategórie", "odborové rady"],
    noIndex: filtered,
  });
}

async function CategoriesPageContent() {
  await connection();
  const result = await searchCategoriesAction({ page: 1, pageSize: 40 });

  return (
    <CategoriesCatalog initialCategories={result?.data?.items ?? []} />
  );
}

export default function CategoriesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={5} />}>
        <CategoriesPageContent />
      </Suspense>
    </div>
  );
}
