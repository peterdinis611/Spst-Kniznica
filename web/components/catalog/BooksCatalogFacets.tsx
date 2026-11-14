"use client";

import Link from "next/link";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  buildBooksCatalogHref,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
import type { CatalogCategory } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { cn } from "@/lib/utils";

type BooksCatalogFacetsProps = {
  filters: BooksCatalogFilters;
  liveQuery: string;
  categories: CatalogCategory[];
  filterCount: number;
  onOpenAdvanced: () => void;
  isPending?: boolean;
};

export function BooksCatalogFacets({
  filters,
  liveQuery,
  categories,
  filterCount,
  onOpenAdvanced,
  isPending,
}: BooksCatalogFacetsProps) {
  const q = liveQuery.trim() || undefined;
  const base = { ...filters, q };

  return (
    <div className="space-y-5" data-tour="books-facets">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Kategória
          </p>
          <CatalogChipRow label="Filtrovať podľa kategórie" className="mt-2">
            <Link
              href={buildBooksCatalogHref({ ...base, category: undefined })}
              scroll={false}
              className={cn(
                "shrink-0 border-b-2 px-1 pb-2 text-sm transition",
                !filters.category
                  ? "border-accent font-semibold text-ink"
                  : "border-transparent text-muted-foreground hover:text-ink",
              )}
              aria-current={!filters.category ? "true" : undefined}
            >
              Všetky
            </Link>
            {categories.map((category) => {
              const active = filters.category === category.id;
              return (
                <Link
                  key={category.id}
                  href={buildBooksCatalogHref({
                    ...base,
                    category: active ? undefined : category.id,
                  })}
                  scroll={false}
                  className={cn(
                    "shrink-0 border-b-2 px-1 pb-2 text-sm transition",
                    active
                      ? "border-accent font-semibold text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink",
                  )}
                  aria-current={active ? "true" : undefined}
                >
                  {category.name}
                </Link>
              );
            })}
          </CatalogChipRow>
        </div>

        {isPending ? (
          <span className="pb-2 text-xs text-muted-foreground">Hľadám…</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildBooksCatalogHref({
            ...base,
            available: filters.available ? undefined : true,
          })}
          scroll={false}
          className={cn(
            "inline-flex h-10 items-center gap-2 border px-3 text-sm transition",
            filters.available
              ? "border-sage/45 bg-mint/40 font-medium text-ink dark:bg-paper-deep"
              : "border-rule bg-paper-deep/50 text-muted-foreground hover:border-sage/35 hover:text-ink dark:border-white/12",
          )}
          aria-pressed={filters.available}
        >
          <span
            className={cn(
              "grid size-4 place-items-center border",
              filters.available
                ? "border-sage bg-sage text-paper"
                : "border-rule dark:border-white/20",
            )}
            aria-hidden
          >
            {filters.available ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
          Len dostupné
        </Link>

        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 rounded-none border-rule bg-paper-deep/60 dark:border-white/15",
            filterCount > 0 && "border-sage/40",
          )}
          onClick={onOpenAdvanced}
        >
          <SlidersHorizontal className="size-4 text-sage" aria-hidden />
          Autor & trakt
          {filterCount > 0 ? (
            <span className="ml-1.5 rounded-sm bg-sage/15 px-1.5 py-0.5 font-mono text-[10px] text-sage tabular-nums">
              {filterCount}
            </span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
