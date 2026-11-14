"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
import {
  searchCategoriesAction,
  type SearchCategoriesResult,
} from "@/lib/catalog/actions";
import type { CatalogCategory } from "@/lib/catalog";
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
      page: 1,
      pageSize: 50,
    }),
    [liveQuery],
  );

  const { data, isPending } = useDebouncedCatalogAction<
    typeof input,
    SearchCategoriesResult
  >(searchCategoriesAction, input);

  const results = data?.items ?? initialCategories;
  const chips = results.length > 0 ? results : initialCategories;

  return (
    <>
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
              Register
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
        <ul className="mt-6 grid grid-cols-1 gap-0 border-t border-rule pb-20 dark:border-white/10 sm:grid-cols-2">
          {results.map((category, index) => {
            const featured = index === 0;
            return (
              <li
                key={category.id}
                id={category.id}
                className={cn(
                  "reveal border-b border-rule dark:border-white/10",
                  featured && "sm:col-span-2",
                )}
                style={{ animationDelay: `${(index % 6) * 0.05}s` }}
              >
                <Link
                  href={`/categories/${category.id}`}
                  className={cn(
                    "group relative flex gap-5 overflow-hidden px-1 py-8 transition sm:gap-8 sm:py-10",
                    featured ? "flex-col sm:flex-row sm:items-end" : "flex-col",
                  )}
                >
                  <span
                    className="pointer-events-none absolute top-6 right-0 font-display text-[clamp(4rem,14vw,7rem)] leading-none text-ink/[0.04] tabular-nums select-none dark:text-white/[0.05]"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div
                    className={cn(
                      "relative shrink-0",
                      featured ? "h-2 w-24 sm:h-28 sm:w-2" : "h-1.5 w-16",
                    )}
                    style={{ background: category.accent }}
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
                          ? "text-[clamp(2.4rem,6vw,4rem)]"
                          : "text-[clamp(1.75rem,4vw,2.5rem)]",
                      )}
                    >
                      {category.name}
                    </h2>
                    <p
                      className={cn(
                        "mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]",
                        featured ? "max-w-lg" : "max-w-sm",
                      )}
                    >
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
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
