import { Suspense } from "react";
import { AuthorsCatalog } from "@/components/catalog/AuthorsCatalog";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export const metadata = {
  title: "Autori",
};

export default function AuthorsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <AuthorsCatalog />
      </Suspense>
    </main>
  );
}
