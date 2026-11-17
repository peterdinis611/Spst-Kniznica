import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function DeskLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <CatalogSkeleton rows={5} variant="desk" />
    </div>
  );
}
