import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RouteLoadingProps = {
  variant?: "landing" | "catalog" | "detail" | "auth" | "admin";
  className?: string;
};

export function RouteLoading({
  variant = "catalog",
  className,
}: RouteLoadingProps) {
  if (variant === "landing") {
    return (
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:gap-10 md:px-8",
          className,
        )}
        aria-busy
        aria-live="polite"
      >
        <div className="space-y-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-full max-w-md sm:h-20" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="mt-10 aspect-[3/4] w-full" />
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <main
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10",
          className,
        )}
        aria-busy
      >
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
      </main>
    );
  }

  if (variant === "auth" || variant === "admin") {
    return (
      <main
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 md:px-8",
          className,
        )}
        aria-busy
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton
          className={cn(
            "mt-8 w-full",
            variant === "admin" ? "h-64" : "h-56 max-w-md",
          )}
        />
      </main>
    );
  }

  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10",
        className,
      )}
      aria-busy
      aria-live="polite"
    >
      <CatalogSkeleton rows={4} />
    </main>
  );
}
