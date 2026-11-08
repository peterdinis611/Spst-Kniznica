import { Suspense } from "react";
import { AuthorsCatalog } from "@/components/catalog/AuthorsCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchAuthorsAction } from "@/lib/actions/authors";

export const metadata = {
  title: "Autori",
};

async function AuthorsPageContent() {
  const result = await searchAuthorsAction({ page: 1, pageSize: 50 });
  const authors = result?.data?.items ?? [];
  const initials = [
    ...new Set(authors.map((author) => author.name.charAt(0).toUpperCase())),
  ].sort((a, b) => a.localeCompare(b, "sk"));

  return (
    <AuthorsCatalog initialAuthors={authors} initials={initials} />
  );
}

export default function AuthorsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <AuthorsPageContent />
      </Suspense>
    </main>
  );
}
