"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
import {
  searchAuthorsAction,
  type SearchAuthorsResult,
} from "@/lib/actions/authors";
import type { CatalogAuthor } from "@/lib/catalog-mappers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AuthorsCatalogProps = {
  initialAuthors: CatalogAuthor[];
  initials: string[];
};

export function AuthorsCatalog({
  initialAuthors,
  initials,
}: AuthorsCatalogProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const letter = searchParams.get("letter") ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const input = useMemo(
    () => ({
      search: liveQuery.trim() || undefined,
      letter: letter || undefined,
      page: 1,
      pageSize: 50,
    }),
    [liveQuery, letter],
  );

  const { data, isPending } = useDebouncedCatalogAction<
    typeof input,
    SearchAuthorsResult
  >(searchAuthorsAction, input);

  const results = data?.items ?? initialAuthors;

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Autori" }]}
      />

      <CatalogTopBar
        title="Autori fondu"
        lead="Hľadaj podľa mena. Abecedné chipy filtrujú zoznam pod vyhľadávaním."
        searchAction="/authors"
        defaultQuery={urlQuery}
        placeholder="Meno autora…"
        showCategorySelect={false}
        hiddenFields={letter ? { letter } : undefined}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="space-y-5 pt-10 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {letter ? `Písmeno ${letter.toUpperCase()}` : "Abecedný prehľad"}
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
              {results.length === 1 ? "autor" : "autorov"}
            </span>
          </Badge>
        </div>

        <CatalogChipRow label="Začiatočné písmeno">
          <Button
            size="sm"
            variant={!letter ? "default" : "outline"}
            className={cn(
              "rounded-full",
              !letter
                ? "bg-accent text-black hover:bg-accent-deep"
                : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
            )}
            render={
              <Link
                href={
                  liveQuery.trim()
                    ? `/authors?q=${encodeURIComponent(liveQuery.trim())}`
                    : "/authors"
                }
              />
            }
          >
            Všetci
          </Button>
          {initials.map((item) => {
            const active = letter.toUpperCase() === item;
            const href = liveQuery.trim()
              ? `/authors?letter=${item}&q=${encodeURIComponent(liveQuery.trim())}`
              : `/authors?letter=${item}`;
            return (
              <Button
                key={item}
                size="sm"
                variant={active ? "default" : "outline"}
                className={cn(
                  "min-w-10 rounded-full",
                  active
                    ? "bg-accent text-black hover:bg-accent-deep"
                    : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
                )}
                render={<Link href={href} />}
              >
                {item}
              </Button>
            );
          })}
        </CatalogChipRow>
      </div>

      {results.length === 0 ? (
        <CatalogEmpty
          title="Nikto sa nenašiel"
          description="Skús iné meno alebo zruš filter písmena."
          resetHref="/authors"
        />
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule pb-16 dark:divide-white/10 dark:border-white/10">
          {results.map((author, index) => (
            <li
              key={author.id}
              className="reveal grid gap-4 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-6 sm:py-7"
              style={{ animationDelay: `${(index % 8) * 0.04}s` }}
            >
              <Avatar
                size="lg"
                className="hidden size-12 sm:flex"
                style={{ background: author.accent }}
              >
                <AvatarFallback
                  className="bg-transparent font-display text-lg text-white"
                  style={{ background: author.accent }}
                >
                  {author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-2xl leading-tight text-ink sm:text-[1.75rem]">
                    {author.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] tracking-[0.14em] uppercase"
                  >
                    {author.nationality}
                  </Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {author.bio}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-3 h-auto px-0 text-sm text-ink"
                  render={
                    <Link
                      href={`/books?q=${encodeURIComponent(author.name)}`}
                    />
                  }
                >
                  Zobraziť knihy autora
                </Button>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                {author.bookCount > 0 ? (
                  <Badge className="h-auto rounded-full bg-accent px-3 py-1 font-display text-lg tabular-nums text-black hover:bg-accent">
                    {author.bookCount}
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
