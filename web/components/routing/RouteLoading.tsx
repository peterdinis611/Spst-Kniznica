import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RouteLoadingProps = {
  variant?: "landing" | "catalog" | "detail" | "auth" | "admin" | "status";
  className?: string;
};

export function RouteLoading({
  variant = "catalog",
  className,
}: RouteLoadingProps) {
  if (variant === "status") {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-14 sm:px-6 md:px-8 md:py-20",
          className,
        )}
        aria-busy
        aria-live="polite"
        role="status"
      >
        <span className="sr-only">Načítavam stránku…</span>
        <div
          className="relative w-full max-w-2xl overflow-hidden border border-rule bg-card/55 px-7 py-16 sm:px-11 sm:py-[4.75rem] dark:border-white/12 dark:bg-surface-3/45"
          aria-hidden
        >
          <div className="mx-auto mb-7 flex justify-center">
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
          <Skeleton className="mx-auto h-3 w-28" />
          <Skeleton className="mx-auto mt-5 h-12 w-64 max-w-full sm:h-14 sm:w-80" />
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-md" />
          <Skeleton className="mx-auto mt-2 h-4 w-3/4 max-w-sm" />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:gap-10 md:px-8",
          className,
        )}
        aria-busy
        aria-live="polite"
        role="status"
      >
        <span className="sr-only">Načítavam stránku…</span>
        <div className="space-y-5" aria-hidden>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-full max-w-md sm:h-20" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4" aria-hidden>
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="mt-10 aspect-[3/4] w-full" />
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10",
          className,
        )}
        aria-busy
        role="status"
      >
        <span className="sr-only">Načítavam detail…</span>
        <div aria-hidden>
          <Skeleton className="h-3 w-40" />
          <div className="mt-8 grid gap-8 border-t border-rule pt-8 md:grid-cols-[240px_1fr] dark:border-white/10">
            <Skeleton className="mx-auto aspect-[3/4] w-44 sm:w-full" />
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
              <Skeleton className="h-14 w-full max-w-xl" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-6 h-28 w-full max-w-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "auth" || variant === "admin") {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 md:px-8",
          className,
        )}
        aria-busy
        role="status"
      >
        <span className="sr-only">Načítavam…</span>
        <div aria-hidden>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-12 w-72 max-w-full" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
          <Skeleton
            className={cn(
              "mt-8 w-full",
              variant === "admin" ? "h-64" : "h-56 max-w-md",
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10",
        className,
      )}
      aria-busy
      aria-live="polite"
      role="status"
    >
      <CatalogSkeleton rows={4} variant="books" />
    </div>
  );
}
