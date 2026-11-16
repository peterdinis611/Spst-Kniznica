"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpRight } from "lucide-react";
import { ResultsStatus } from "@/components/a11y/ResultsStatus";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogLoadMore } from "@/components/catalog/CatalogLoadMore";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useCatalogLaneCount } from "@/hooks/use-catalog-lane-count";
import { useCursorCatalog } from "@/hooks/use-cursor-catalog";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import { searchCategoriesCursorAction } from "@/lib/catalog/actions";
import type { CatalogCategory } from "@/lib/catalog";
import {
  AccentFillDiv,
  VirtualList,
  VirtualRow,
} from "@/components/styled/primitives";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CategoriesCatalogProps = {
  initialCategories: CatalogCategory[];
};

export function CategoriesCatalog({
  initialCategories,
}: CategoriesCatalogProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const input = useMemo(
    () => ({
      search: liveQuery.trim() || undefined,
      limit: 40,
    }),
    [liveQuery],
  );

  const { items: results, isPending, hasMore, loadingMore, loadMore } =
    useCursorCatalog(searchCategoriesCursorAction, input, initialCategories);

  const chips = results.length > 0 ? results : initialCategories;
  const lanes = useCatalogLaneCount();
  const gridRef = useRef<HTMLUListElement>(null);
  const scrollMargin = useWindowScrollMargin(gridRef, [
    results.length,
    lanes,
    liveQuery,
  ]);
  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 220,
    overscan: 8,
    lanes,
    scrollMargin,
  });
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems.at(-1);
    if (!last) return;
    if (last.index >= results.length - 4) {
      void loadMore();
    }
  }, [virtualItems, results.length, loadMore]);

  return (
    <>
      <ResultsStatus
        count={results.length}
        labelSingular="kategória"
        labelPlural="kategórií"
        pending={isPending}
        query={liveQuery}
      />

      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Kategórie" }]}
      />

      <CatalogTopBar
        title="Žánre a rady"
        lead="Tematické rady školského fondu. Otvor kategóriu a pozri tituly."
        searchAction="/categories"
        defaultQuery={urlQuery}
        placeholder="Názov kategórie…"
        showCategorySelect={false}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div
        className="space-y-6 pt-10 sm:pt-12"
        data-tour="categories-register"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Evidencia
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tematické rady
              {liveQuery.trim() ? (
                <>
                  {" "}
                  · „<span className="text-ink">{liveQuery.trim()}</span>“
                </>
              ) : null}
              {isPending ? <span className="ml-2 text-xs">· hľadám…</span> : null}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="h-auto rounded-none bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {results.length}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {results.length === 1 ? "kategória" : "kategórií"}
            </span>
          </Badge>
        </div>

        <CatalogChipRow label="Rýchly skok na kategóriu">
          {chips.map((item) => (
            <Link
              key={item.id}
              href={`/categories/${item.id}`}
              className="shrink-0 border-b-2 border-transparent px-1 pb-2 text-sm text-muted-foreground transition hover:border-accent/50 hover:text-ink"
            >
              {item.name}
            </Link>
          ))}
        </CatalogChipRow>
      </div>

      {results.length === 0 ? (
        <CatalogEmpty
          title="Žiadna kategória"
          description="Skús iný výraz alebo vymaž vyhľadávanie."
          resetHref="/categories"
          resetLabel="Resetovať"
        />
      ) : (
        <VirtualList
          ref={gridRef}
          className="relative mt-6 border-t border-rule pb-20 dark:border-white/10"
          $height={virtualizer.getTotalSize()}
          aria-busy={isPending || undefined}
          aria-label="Zoznam kategórií"
        >
          {virtualItems.map((virtualItem) => {
            const category = results[virtualItem.index];
            if (!category) return null;
            const index = virtualItem.index;
            const featured = index === 0;
            return (
              <VirtualRow
                key={category.id}
                id={category.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 border-b border-rule dark:border-white/10"
                $start={virtualItem.start - scrollMargin}
                $widthPct={100 / lanes}
                $leftPct={(virtualItem.lane * 100) / lanes}
              >
                <Link
                  href={`/categories/${category.id}`}
                  className={cn(
                    "group relative flex h-full flex-col gap-5 overflow-hidden px-3 py-8 transition sm:gap-6 sm:px-4 sm:py-10",
                    featured && "sm:flex-row sm:items-end",
                  )}
                >
                  <span
                    className="pointer-events-none absolute top-6 right-3 font-display text-[clamp(3.5rem,12vw,6rem)] leading-none text-ink/[0.04] tabular-nums select-none dark:text-white/[0.05]"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <AccentFillDiv
                    $color={category.accent}
                    className={cn(
                      "relative shrink-0",
                      featured ? "h-2 w-24 sm:h-24 sm:w-2" : "h-1.5 w-16",
                    )}
                    aria-hidden
                  />

                  <div className="relative min-w-0 flex-1">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      Rada {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2
                      className={cn(
                        "mt-2 font-display leading-[0.98] tracking-tight text-ink transition group-hover:text-sage",
                        featured
                          ? "text-[clamp(2rem,5vw,3.25rem)]"
                          : "text-[clamp(1.6rem,3.5vw,2.25rem)]",
                      )}
                    >
                      {category.name}
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {category.description}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                      Otvoriť kategóriu
                      <ArrowUpRight
                        className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>
              </VirtualRow>
            );
          })}
        </VirtualList>
      )}

      <CatalogLoadMore
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadedCount={results.length}
        onLoadMore={() => void loadMore()}
        itemLabel="kategórií"
        loadingLabel="Načítavam ďalšie kategórie…"
        ariaLabel="Načítať ďalšie kategórie"
      />
    </>
  );
}
