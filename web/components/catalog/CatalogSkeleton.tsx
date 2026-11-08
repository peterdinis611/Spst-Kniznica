import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-64 max-w-full sm:h-14 sm:w-80" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="mt-4 h-12 w-full max-w-2xl rounded-full" />
      </div>
      <div className="space-y-3 border-t border-rule pt-10 dark:border-white/10">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
