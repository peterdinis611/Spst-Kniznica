import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function LibraryLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <CatalogSkeleton rows={4} variant="library" />
    </div>
  );
}
