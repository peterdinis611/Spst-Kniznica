"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { X } from "lucide-react";
import { BookCard } from "@/components/catalog/BookCard";
import { BooksCatalogFacets } from "@/components/catalog/BooksCatalogFacets";
import { BooksCatalogFiltersDialog } from "@/components/catalog/BooksCatalogFiltersDialog";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useCatalogColumnCount } from "@/hooks/use-catalog-column-count";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import {
  buildBooksCatalogHref,
  parseBooksCatalogFilters,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
import {
  searchBooksAction,
  type SearchBooksResult,
} from "@/lib/catalog/actions";
import type { CatalogAuthor, CatalogBook, CatalogCategory } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type BooksCatalogProps = {
  initialBooks: CatalogBook[];
  initialCategories: CatalogCategory[];
  initialAuthors: CatalogAuthor[];
  shelfZones: Array<{ id: string; label: string }>;
};

/** Advanced filters that live in the dialog (category + available are inline). */
function countAdvancedFilters(filters: BooksCatalogFilters): number {
  let n = 0;
  if (filters.author) n += 1;
  if (filters.shelf) n += 1;
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
      categoryId: activeFilters.category,
      authorId: activeFilters.author,
      shelfLocation: activeFilters.shelf
        ? `${activeFilters.shelf}-`
        : undefined,
      availableOnly: activeFilters.available,
      page: 1,
      pageSize: 50,
    }),
    [activeFilters],
  );

  const { data, isPending } = useDebouncedCatalogAction<
    typeof input,
    SearchBooksResult
  >(searchBooksAction, input);

  const results = data?.items ?? initialBooks;
  const columns = useCatalogColumnCount();
  const gridRef = useRef<HTMLUListElement>(null);
  const scrollMargin = useWindowScrollMargin(gridRef, [
    results.length,
    columns,
    activeFilters.q,
    activeFilters.category,
    activeFilters.author,
    activeFilters.shelf,
    activeFilters.available,
  ]);
  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 360,
    overscan: 10,
    lanes: columns,
    scrollMargin,
  });
  const activeAuthor = initialAuthors.find(
    (item) => item.id === filters.author,
  );
  const activeShelf = shelfZones.find((item) => item.id === filters.shelf);
  const advancedCount = countAdvancedFilters(filters);
  const hasAnyFilter =
    Boolean(filters.category) ||
    Boolean(filters.available) ||
    advancedCount > 0 ||
    Boolean(liveQuery.trim());

  const activeTags = [
    activeAuthor
      ? { key: "author", label: activeAuthor.name, clear: { author: undefined } }
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
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Knihy" }]}
      />

      <CatalogTopBar
        title="Knižný fond"
        lead="Hľadaj názov alebo tému — kategóriu a dostupnosť prepneš jedným klikom."
        defaultQuery={urlQuery}
        defaultCategory={filters.category}
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
            filterCount={advancedCount}
            onOpenAdvanced={() => setFiltersOpen(true)}
            isPending={isPending}
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

          {hasAnyFilter ? (
            <p className="text-sm text-muted-foreground">
              {liveQuery.trim() ? (
                <>
                  Výsledky pre „{liveQuery.trim()}“
                  {filters.category || filters.available || advancedCount > 0
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
          {results.length}{" "}
          <span className="font-sans font-normal text-muted-foreground">
            {results.length === 1 ? "titul" : "titulov"}
          </span>
        </Badge>
      </div>

      <BooksCatalogFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        applied={filters}
        authors={initialAuthors}
        shelfZones={shelfZones}
        searchQuery={liveQuery}
      />

      {results.length === 0 ? (
        <CatalogEmpty
          title="Nič sa nenašlo"
          description="Skús iný filter alebo výraz v vyhľadávaní."
          resetHref="/books"
        />
      ) : (
        <ul
          ref={gridRef}
          className="relative mt-8 pb-16"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const book = results[virtualItem.index];
            return (
              <li
                key={book.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 p-1.5 sm:p-2 md:p-2.5"
                style={{
                  width: `${100 / columns}%`,
                  left: `${(virtualItem.lane * 100) / columns}%`,
                  transform: `translateY(${virtualItem.start - scrollMargin}px)`,
                }}
              >
                <BookCard book={book} index={virtualItem.index} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
