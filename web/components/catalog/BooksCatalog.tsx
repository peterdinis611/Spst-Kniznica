"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookCard } from "@/components/catalog/BookCard";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
import {
  searchBooksAction,
  type SearchBooksResult,
} from "@/lib/catalog/actions";
import type { CatalogBook, CatalogCategory } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type BooksCatalogProps = {
  initialBooks: CatalogBook[];
  initialCategories: CatalogCategory[];
};

export function BooksCatalog({
  initialBooks,
  initialCategories,
}: BooksCatalogProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const input = useMemo(
    () => ({
      search: liveQuery.trim() || undefined,
      categoryId: category || undefined,
      page: 1,
      pageSize: 50,
    }),
    [liveQuery, category],
  );

  const { data, isPending } = useDebouncedCatalogAction<
    typeof input,
    SearchBooksResult
  >(searchBooksAction, input);

  const results = data?.items ?? initialBooks;
  const activeCategory = initialCategories.find((item) => item.id === category);

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Knihy" }]}
      />

      <CatalogTopBar
        title="Knižný fond"
        lead="Nájdi titul podľa názvu alebo autora. Kategórie filtruj chipmi pod vyhľadávaním."
        defaultQuery={urlQuery}
        defaultCategory={category}
        showCategorySelect={false}
        categories={initialCategories}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="space-y-5 pt-10 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {activeCategory ? activeCategory.name : "Celý fond"}
            {liveQuery.trim() ? (
              <>
                {" "}
                · výsledky pre „
                <span className="text-ink">{liveQuery.trim()}</span>“
              </>
            ) : null}
            {isPending ? <span className="ml-2 text-xs">· hľadám…</span> : null}
          </p>
          <Badge
            variant="secondary"
            className="h-auto rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {results.length}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {results.length === 1 ? "titul" : "titulov"}
            </span>
          </Badge>
        </div>

        <CatalogChipRow label="Kategórie">
          <Button
            size="sm"
            variant={!category ? "default" : "outline"}
            className={cn(
              "rounded-full",
              !category
                ? "bg-accent text-black hover:bg-accent-deep"
                : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
            )}
            render={
              <Link
                href={
                  liveQuery.trim()
                    ? `/books?q=${encodeURIComponent(liveQuery.trim())}`
                    : "/books"
                }
              />
            }
          >
            Všetky
          </Button>
          {initialCategories.map((item) => {
            const active = category === item.id;
            const href = liveQuery.trim()
              ? `/books?category=${item.id}&q=${encodeURIComponent(liveQuery.trim())}`
              : `/books?category=${item.id}`;
            return (
              <Button
                key={item.id}
                size="sm"
                variant={active ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  active
                    ? "bg-accent text-black hover:bg-accent-deep"
                    : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
                )}
                render={<Link href={href} />}
              >
                {item.name}
              </Button>
            );
          })}
        </CatalogChipRow>
      </div>

      {results.length === 0 ? (
        <CatalogEmpty
          title="Nič sa nenašlo"
          description="Skús iný výraz alebo zruš filter kategórie."
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
