"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { X } from "@/components/icons";
import { ResultsStatus } from "@/components/a11y/ResultsStatus";
import { BookCard } from "@/components/catalog/BookCard";
import { BooksCatalogFacets } from "@/components/catalog/BooksCatalogFacets";
import { BooksCatalogFiltersDialog } from "@/components/catalog/BooksCatalogFiltersDialog";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogLoadMore } from "@/components/catalog/CatalogLoadMore";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useCatalogColumnCount } from "@/hooks/use-catalog-column-count";
import { useCursorCatalog } from "@/hooks/use-cursor-catalog";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import {
  buildBooksCatalogHref,
  languageFilterLabel,
  parseBooksCatalogFilters,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
import { searchBooksCursorAction } from "@/lib/catalog/actions";
import type { CatalogAuthor, CatalogBook, CatalogCategory } from "@/lib/catalog";
import { VirtualList, VirtualRow } from "@/components/styled/primitives";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type BooksCatalogProps = {
  initialBooks: CatalogBook[];
  initialCategories: CatalogCategory[];
  initialAuthors: CatalogAuthor[];
  shelfZones: Array<{ id: string; label: string }>;
};

/** Advanced filters that live in the dialog (category/author/available are inline). */
function countAdvancedFilters(filters: BooksCatalogFilters): number {
  let n = 0;
  if (filters.shelf) n += 1;
  if (filters.year != null) n += 1;
  if (filters.language) n += 1;
  return n;
}

export function BooksCatalog({
  initialBooks,
  initialCategories,
  initialAuthors,
  shelfZones,
}: BooksCatalogProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseBooksCatalogFilters(searchParams),
    [searchParams],
  );
  const urlQuery = filters.q ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const activeFilters = useMemo(
    (): BooksCatalogFilters => ({
      ...filters,
      q: liveQuery.trim() || undefined,
    }),
    [filters, liveQuery],
  );

  const input = useMemo(
    () => ({
      search: activeFilters.q,
      categoryIds: activeFilters.categories,
      authorIds: activeFilters.authors,
      shelfLocation: activeFilters.shelf
        ? `${activeFilters.shelf}-`
        : undefined,
      availableOnly: activeFilters.available,
      language: activeFilters.language,
      year: activeFilters.year,
      limit: 40,
    }),
    [activeFilters],
  );

  const { items: results, isPending, hasMore, loadingMore, loadMore } =
    useCursorCatalog(searchBooksCursorAction, input, initialBooks);

  const columns = useCatalogColumnCount();
  const gridRef = useRef<HTMLUListElement>(null);
  const scrollMargin = useWindowScrollMargin(gridRef, [
    results.length,
    columns,
    activeFilters.q,
    activeFilters.categories?.join(","),
    activeFilters.authors?.join(","),
    activeFilters.shelf,
    activeFilters.available,
    activeFilters.year,
    activeFilters.language,
  ]);
  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 360,
    overscan: 14,
    lanes: columns,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems.at(-1);
    if (!last) return;
    if (last.index >= results.length - 8) {
      void loadMore();
    }
  }, [virtualItems, results.length, loadMore]);
  const activeShelf = shelfZones.find((item) => item.id === filters.shelf);
  const advancedCount = countAdvancedFilters(filters);
  const hasAnyFilter =
    Boolean(filters.categories?.length) ||
    Boolean(filters.authors?.length) ||
    Boolean(filters.available) ||
    advancedCount > 0 ||
    Boolean(liveQuery.trim());

  const activeTags = [
    filters.year != null
      ? {
          key: "year",
          label: `Rok ${filters.year}`,
          clear: { year: undefined },
        }
      : null,
    filters.language
      ? {
          key: "language",
          label: languageFilterLabel(filters.language),
          clear: { language: undefined },
        }
      : null,
    activeShelf
      ? {
          key: "shelf",
          label: `Trakt ${activeShelf.id}`,
          clear: { shelf: undefined },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    clear: Partial<BooksCatalogFilters>;
  }>;

  return (
    <>
      <ResultsStatus
        count={results.length}
        labelSingular="titul"
        labelPlural="titulov"
        pending={isPending}
        query={liveQuery}
      />

      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Knihy" }]}
      />

      <CatalogTopBar
        title="Knižný fond"
        lead="Hľadaj názov alebo tému — kategórie a autorov vyberieš vo filtri (aj viac naraz)."
        defaultQuery={urlQuery}
        defaultCategory={filters.categories?.[0]}
        showCategorySelect={false}
        categories={initialCategories}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="flex flex-wrap items-start justify-between gap-4 pt-8 sm:pt-10">
        <div className="min-w-0 flex-1 space-y-4">
          <BooksCatalogFacets
            filters={filters}
            liveQuery={liveQuery}
            categories={initialCategories}
            authors={initialAuthors}
            filterCount={advancedCount}
            onOpenAdvanced={() => setFiltersOpen(true)}
            filtersOpen={filtersOpen}
          />

          {activeTags.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-2">
              {activeTags.map((tag) => (
                <li key={tag.key}>
                  <Link
                    href={buildBooksCatalogHref({
                      ...filters,
                      ...tag.clear,
                      q: liveQuery.trim() || undefined,
                    })}
                    scroll={false}
                    className="group inline-flex items-center gap-1.5 border border-rule bg-card/80 py-1 pr-2 pl-2.5 text-xs text-ink transition hover:border-sage/40 dark:border-white/12"
                  >
                    {tag.label}
                    <X
                      className="size-3 text-muted-foreground group-hover:text-ink"
                      aria-hidden
                    />
                    <span className="sr-only">Odstrániť filter</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {isPending ? (
            <p className="text-sm text-sage" role="status" aria-live="polite">
              Hľadám v katalógu…
            </p>
          ) : hasAnyFilter ? (
            <p className="text-sm text-muted-foreground">
              {liveQuery.trim() ? (
                <>
                  Výsledky pre „{liveQuery.trim()}“
                  {filters.categories?.length ||
                  filters.authors?.length ||
                  filters.available ||
                  advancedCount > 0
                    ? " · s filtrami"
                    : null}
                </>
              ) : (
                "Aktívne filtre — zoznam je zúžený"
              )}{" "}
              <Link
                href="/books"
                scroll={false}
                className="text-sage underline-offset-2 hover:underline"
              >
                Zrušiť všetko
              </Link>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Celý fond — bez aktívnych filtrov
            </p>
          )}
        </div>

        <Badge
          variant="secondary"
          className="h-auto shrink-0 rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
        >
          {isPending ? "…" : results.length}{" "}
          <span className="font-sans font-normal text-muted-foreground">
            {results.length === 1 && !isPending ? "titul" : "titulov"}
          </span>
        </Badge>
      </div>

      <BooksCatalogFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        applied={filters}
        shelfZones={shelfZones}
        searchQuery={liveQuery}
      />

      {results.length === 0 && isPending ? (
        <div className="mt-8">
          <CatalogSkeleton rows={6} variant="books-grid" />
        </div>
      ) : results.length === 0 ? (
        <CatalogEmpty
          title="Nič sa nenašlo"
          description="Skús iný filter alebo výraz v vyhľadávaní."
          resetHref="/books"
        />
      ) : (
        <VirtualList
          ref={gridRef}
          className={`relative mt-8 pb-16 transition-opacity duration-200 ${isPending ? "opacity-55" : "opacity-100"}`}
          $height={virtualizer.getTotalSize()}
          aria-busy={isPending || undefined}
          aria-label="Výsledky kníh"
        >
          {virtualItems.map((virtualItem) => {
            const book = results[virtualItem.index];
            if (!book) return null;
            return (
              <VirtualRow
                key={book.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 p-1.5 sm:p-2 md:p-2.5"
                $start={virtualItem.start - scrollMargin}
                $widthPct={100 / columns}
                $leftPct={(virtualItem.lane * 100) / columns}
              >
                <BookCard book={book} index={virtualItem.index} />
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
        itemLabel="titulov"
        loadingLabel="Načítavam ďalšie tituly…"
        ariaLabel="Načítať ďalšie tituly"
      />
    </>
  );
}
