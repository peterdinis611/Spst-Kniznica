"use client";

import { Button } from "@/components/ui/button";

type CatalogLoadMoreProps = {
  hasMore: boolean;
  loadingMore: boolean;
  loadedCount: number;
  onLoadMore: () => void;
  /** e.g. "titulov", "autorov", "kategórií" */
  itemLabel: string;
  loadingLabel: string;
  ariaLabel?: string;
};

/**
 * Explicit cursor-pagination control for virtualized catalogs.
 * Complements silent infinite scroll so users always see a way to fetch more.
 */
export function CatalogLoadMore({
  hasMore,
  loadingMore,
  loadedCount,
  onLoadMore,
  itemLabel,
  loadingLabel,
  ariaLabel = "Načítať ďalšie položky",
}: CatalogLoadMoreProps) {
  if (loadedCount === 0) return null;
  if (!hasMore && !loadingMore) return null;

  return (
    <nav
      className="mt-8 mb-4 flex flex-col items-center gap-3 pb-6"
      aria-label="Paginácia katalógu"
    >
      <p
        className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase"
        aria-live="polite"
      >
        {loadingMore
          ? loadingLabel
          : `Zobrazených ${loadedCount} ${itemLabel} · ďalšie k dispozícii`}
      </p>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="mx-auto w-full max-w-xs rounded-none border-ink px-6 sm:w-auto sm:min-w-[12rem]"
          disabled={loadingMore}
          aria-label={ariaLabel}
          onClick={() => onLoadMore()}
        >
          {loadingMore ? "Načítavam…" : "Načítať ďalšie"}
        </Button>
      ) : null}
    </nav>
  );
}
