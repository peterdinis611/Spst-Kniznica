import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AuthorsCatalog } from "@/components/catalog/AuthorsCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchAuthorsAction } from "@/lib/catalog/actions";
import {
  AUTHORS_FILTER_QUERY_KEYS,
  catalogSearchParamsAreFiltered,
} from "@/lib/seo/catalog-query-index";
import { buildPageMetadata } from "@/lib/seo/metadata";

type AuthorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: AuthorsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = catalogSearchParamsAreFiltered(
    params,
    AUTHORS_FILTER_QUERY_KEYS,
  );

  return buildPageMetadata({
    title: "Autori",
    description:
      "Abecedný prehľad autorov vo fonde SPST Knižnice s biografiami a národnosťou.",
    path: "/authors",
    keywords: ["autori", "biografie"],
    noIndex: filtered,
  });
}

async function AuthorsPageContent() {
  await connection();
  const result = await searchAuthorsAction({ page: 1, pageSize: 40 });
  const authors = result?.data?.items ?? [];
  const initials = [
    ...new Set(authors.map((author) => author.name.charAt(0).toUpperCase())),
  ].sort((a, b) => a.localeCompare(b, "sk"));

  return <AuthorsCatalog initialAuthors={authors} initials={initials} />;
}

export default function AuthorsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={5} />}>
        <AuthorsPageContent />
      </Suspense>
    </div>
  );
}
