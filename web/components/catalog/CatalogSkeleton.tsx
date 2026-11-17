import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CatalogSkeletonVariant =
  | "default"
  | "books"
  | "books-grid"
  | "desk"
  | "panel"
  | "library";

type CatalogSkeletonProps = {
  rows?: number;
  variant?: CatalogSkeletonVariant;
  className?: string;
};

export function CatalogSkeleton({
  rows = 4,
  variant = "default",
  className,
}: CatalogSkeletonProps) {
  const label =
    variant === "desk"
      ? "Načítavam výpožičný pult…"
      : variant === "library"
        ? "Načítavam knižnicu…"
        : variant === "panel"
          ? "Načítavam…"
          : "Načítavam katalóg…";

  return (
    <div
      className={cn("space-y-8", className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label.replace("…", "")}
    >
      <span className="sr-only">{label}</span>

      {variant === "panel" ? (
        <div className="space-y-4 border border-rule p-6 dark:border-white/10" aria-hidden>
          <div className="flex justify-between">
            <Skeleton className="size-12" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-6 w-24" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      ) : null}

      {variant === "books-grid" ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden
        >
          {Array.from({ length: Math.max(rows, 6) }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-3 w-[65%]" />
            </div>
          ))}
        </div>
      ) : null}

      {variant === "books" || variant === "default" ? (
        <>
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-64 max-w-full sm:h-14 sm:w-80" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
          </div>
          <div
            className="space-y-4 border-t border-rule pt-8 dark:border-white/10"
            aria-hidden
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full max-w-md" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full max-w-md" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          {variant === "books" ? (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-hidden
            >
              {Array.from({ length: Math.max(rows, 6) }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-3 w-[65%]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4" aria-hidden>
              {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}
        </>
      ) : null}

      {variant === "desk" || variant === "library" ? (
        <>
          <div className="space-y-3 border-b border-rule pb-6 dark:border-white/10" aria-hidden>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-72 max-w-full" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 border-b border-rule py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-[75%] max-w-md" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
