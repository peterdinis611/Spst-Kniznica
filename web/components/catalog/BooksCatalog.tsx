"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { BookCard } from "@/components/catalog/BookCard";
import { BooksCatalogFiltersDialog } from "@/components/catalog/BooksCatalogFiltersDialog";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type BooksCatalogProps = {
  initialBooks: CatalogBook[];
  initialCategories: CatalogCategory[];
  initialAuthors: CatalogAuthor[];
  shelfZones: Array<{ id: string; label: string }>;
};

function countActiveFilters(filters: BooksCatalogFilters): number {
  let n = 0;
  if (filters.category) n += 1;
  if (filters.author) n += 1;
  if (filters.shelf) n += 1;
  if (filters.available) n += 1;
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
  const activeCategory = initialCategories.find(
    (item) => item.id === filters.category,
  );
  const activeAuthor = initialAuthors.find(
    (item) => item.id === filters.author,
  );
  const activeShelf = shelfZones.find((item) => item.id === filters.shelf);
  const filterCount = countActiveFilters(filters);

  const activeTags = [
    activeCategory
      ? { key: "category", label: activeCategory.name, clear: { category: undefined } }
      : null,
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
    filters.available
      ? {
          key: "available",
          label: "Len dostupné",
          clear: { available: undefined },
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
        lead="Vyhľadaj titul alebo otvor filtre — kategória, autor, trakt poličiek, dostupnosť."
        defaultQuery={urlQuery}
        defaultCategory={filters.category}
        showCategorySelect={false}
        categories={initialCategories}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="flex flex-wrap items-start justify-between gap-4 pt-10 sm:items-center sm:pt-12">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 rounded-none border-rule bg-paper-deep/60 dark:border-white/15",
                filterCount > 0 && "border-sage/40",
              )}
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-4 text-sage" aria-hidden />
              Filtre
              {filterCount > 0 ? (
                <span className="ml-1.5 rounded-sm bg-sage/15 px-1.5 py-0.5 font-mono text-[10px] text-sage tabular-nums">
                  {filterCount}
                </span>
              ) : null}
            </Button>
            {isPending ? (
              <span className="text-xs text-muted-foreground">Hľadám…</span>
            ) : null}
          </div>

          {activeTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <li key={tag.key}>
                  <Link
                    href={buildBooksCatalogHref({
                      ...filters,
                      ...tag.clear,
                      q: liveQuery.trim() || undefined,
                    })}
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
              <li>
                <Link
                  href={buildBooksCatalogHref({
                    q: liveQuery.trim() || undefined,
                  })}
                  className="text-xs text-sage underline-offset-2 hover:underline"
                >
                  Zrušiť všetko
                </Link>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {liveQuery.trim()
                ? `Výsledky pre „${liveQuery.trim()}“ · celý fond`
                : "Celý fond — bez aktívnych filtrov"}
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
        categories={initialCategories}
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
        <ul className="mt-8 grid grid-cols-2 gap-3 pb-16 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
          {results.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </ul>
      )}
    </>
  );
}
