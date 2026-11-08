"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCategoryBooks, MOCK_CATEGORIES } from "@/lib/catalog-mock";
import { searchCategories } from "@/lib/catalog-search";

export function CategoriesCatalog() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const query = liveQuery;
  const results = useMemo(() => searchCategories(query), [query]);
  const chips = results.length > 0 ? results : MOCK_CATEGORIES;

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Kategórie" }]}
      />

      <CatalogTopBar
        title="Žánre a rady"
        lead="Fuzzy hľadanie cez fuse.js — názov aj popis kategórie."
        searchAction="/categories"
        defaultQuery={urlQuery}
        placeholder="Názov kategórie…"
        showCategorySelect={false}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="space-y-5 pt-10 sm:pt-12">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Register kategórií
            {query.trim() ? (
              <>
                {" "}
                · výsledky pre „
                <span className="text-ink">{query.trim()}</span>“
              </>
            ) : null}
          </p>
          <Badge
            variant="secondary"
            className="h-auto rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {results.length}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {results.length === 1 ? "kategória" : "kategórií"}
            </span>
          </Badge>
        </div>

        <CatalogChipRow label="Rýchly skok na kategóriu">
          {chips.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="outline"
              className="rounded-full border-rule bg-paper-deep text-muted-foreground dark:border-white/10"
              render={<a href={`#${item.id}`} />}
            >
              {item.name}
            </Button>
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
        <ul className="mt-10 space-y-0 pb-16">
          {results.map((category, index) => {
            const samples = getCategoryBooks(category.id).slice(0, 3);
            return (
              <li
                key={category.id}
                id={category.id}
                className="reveal scroll-mt-28 border-t border-rule py-10 last:border-b dark:border-white/10 sm:py-12"
                style={{ animationDelay: `${(index % 6) * 0.05}s` }}
              >
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end md:gap-10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: category.accent }}
                        aria-hidden
                      />
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px] tracking-[0.16em] uppercase"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </Badge>
                    </div>

                    <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.1rem)] leading-[0.98] tracking-tight text-ink">
                      {category.name}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {category.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Badge className="h-auto rounded-full bg-accent px-3.5 py-1.5 font-display text-xl tabular-nums text-black hover:bg-accent">
                        {category.bookCount}
                      </Badge>
                      <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                        titulov vo fonde
                      </span>
                    </div>

                    <Button
                      className="group mt-8 h-auto gap-0 overflow-hidden rounded-full border border-ink bg-paper p-0 text-ink hover:bg-paper dark:border-white/30"
                      render={<Link href={`/books?category=${category.id}`} />}
                    >
                      <span className="px-5 py-2.5 text-sm font-semibold">
                        Zobraziť knihy
                      </span>
                      <span className="flex items-center self-stretch bg-ink px-3.5 text-paper transition group-hover:bg-accent group-hover:text-black">
                        <ArrowRight className="size-4" aria-hidden />
                      </span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 self-end sm:gap-4">
                    {samples.length > 0
                      ? samples.map((book, i) => (
                          <Link
                            key={book.id}
                            href={`/books/${book.id}`}
                            className={`transition duration-300 hover:-translate-y-1 ${
                              i === 1
                                ? "mt-3 sm:mt-5"
                                : i === 2
                                  ? "mt-6 sm:mt-9"
                                  : ""
                            }`}
                          >
                            <FlatCover
                              title={book.title}
                              accent={book.accent}
                              secondary={book.secondary}
                              className="shadow-[5px_8px_0_rgba(0,0,0,0.14)] dark:shadow-[5px_8px_0_rgba(0,0,0,0.4)]"
                            />
                          </Link>
                        ))
                      : [0, 1, 2].map((slot) => (
                          <div
                            key={slot}
                            className="aspect-[2/3] bg-paper-deep"
                            style={{
                              background:
                                slot === 1 ? category.accent : undefined,
                              marginTop: slot * 14,
                            }}
                            aria-hidden
                          />
                        ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
