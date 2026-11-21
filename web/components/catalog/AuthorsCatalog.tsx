"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useQueryStates } from "nuqs";
import { ArrowUpRight } from "@/components/icons";
import { ResultsStatus } from "@/components/a11y/ResultsStatus";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { CatalogLoadMore } from "@/components/catalog/CatalogLoadMore";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useCursorCatalog } from "@/hooks/use-cursor-catalog";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import { authorsCatalogParsers } from "@/lib/catalog/catalog-url";
import { searchAuthorsCursorAction } from "@/lib/catalog/actions";
import type { CatalogAuthor } from "@/lib/catalog";
import {
  AccentFillDiv,
  ShadeOverlay,
  VirtualOrderedList,
  VirtualRow,
} from "@/components/styled/primitives";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AuthorsCatalogProps = {
  initialAuthors: CatalogAuthor[];
  initials: string[];
};

function letterHref(letter: string, query: string) {
  const q = query.trim();
  if (letter && q) {
    return `/authors?letter=${letter}&q=${encodeURIComponent(q)}`;
  }
  if (letter) return `/authors?letter=${letter}`;
  if (q) return `/authors?q=${encodeURIComponent(q)}`;
  return "/authors";
}

export function AuthorsCatalog({
  initialAuthors,
  initials,
}: AuthorsCatalogProps) {
  const [urlState] = useQueryStates(authorsCatalogParsers, {
    history: "push",
    scroll: false,
  });
  const urlQuery = urlState.q ?? "";
  const letter = urlState.letter ?? "";
  const [liveQuery, setLiveQuery] = useState(urlQuery);

  useEffect(() => {
    setLiveQuery(urlQuery);
  }, [urlQuery]);

  const input = useMemo(
    () => ({
      search: liveQuery.trim() || undefined,
      letter: letter || undefined,
      limit: 40,
    }),
    [liveQuery, letter],
  );

  const { items: results, isPending, hasMore, loadingMore, loadMore } =
    useCursorCatalog(searchAuthorsCursorAction, input, initialAuthors);

  const listRef = useRef<HTMLOListElement>(null);
  const scrollMargin = useWindowScrollMargin(listRef, [results.length, letter, liveQuery]);
  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 148,
    overscan: 12,
    scrollMargin,
  });
  const virtualRows = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualRows.at(-1);
    if (!last) return;
    if (last.index >= results.length - 6) {
      void loadMore();
    }
  }, [virtualRows, results.length, loadMore]);

  return (
    <>
      <ResultsStatus
        count={results.length}
        labelSingular="autor"
        labelPlural="autorov"
        pending={isPending}
        query={liveQuery}
      />

      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Autori" }]}
      />

      <CatalogTopBar
        title="Autori fondu"
        lead="Evidencia mien zo školského fondu. Klikni na meno — otvorí sa profil a tituly."
        searchAction="/authors"
        defaultQuery={urlQuery}
        placeholder="Meno autora…"
        showCategorySelect={false}
        hiddenFields={letter ? { letter } : undefined}
        onQueryChange={setLiveQuery}
      />

      <Separator className="mt-10 sm:mt-12" />

      <div className="space-y-6 pt-10 sm:pt-12" data-tour="authors-alphabet">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Abecedný index
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {letter
                ? `Písmeno ${letter.toUpperCase()}`
                : "Celá abeceda"}
              {liveQuery.trim() ? (
                <>
                  {" "}
                  · „<span className="text-ink">{liveQuery.trim()}</span>“
                </>
              ) : null}
              {isPending ? (
                <span className="ml-2 text-xs" role="status" aria-live="polite">
                  · hľadám…
                </span>
              ) : null}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="h-auto rounded-none bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {results.length}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {results.length === 1 ? "autor" : "autorov"}
            </span>
          </Badge>
        </div>

        <CatalogChipRow label="Začiatočné písmeno">
          <Link
            href={letterHref("", liveQuery)}
            scroll={false}
            className={cn(
              "snap-start shrink-0 rounded-full border px-3.5 py-2 text-sm transition",
              !letter
                ? "border-accent bg-accent font-semibold text-accent-foreground"
                : "border-rule bg-paper-deep text-muted-foreground hover:border-ink/25 hover:text-ink dark:border-white/12",
            )}
            aria-current={!letter ? "true" : undefined}
          >
            Všetci
          </Link>
          {initials.map((item) => {
            const active = letter.toUpperCase() === item;
            return (
              <Link
                key={item}
                href={letterHref(item, liveQuery)}
                scroll={false}
                className={cn(
                  "snap-start shrink-0 rounded-full border px-3 py-2 font-mono text-sm transition",
                  active
                    ? "border-accent bg-accent font-semibold text-accent-foreground"
                    : "border-rule bg-paper-deep text-muted-foreground hover:border-ink/25 hover:text-ink dark:border-white/12",
                )}
                aria-current={active ? "true" : undefined}
              >
                {item}
              </Link>
            );
          })}
        </CatalogChipRow>
      </div>

      {results.length === 0 && isPending ? (
        <div className="mt-6">
          <CatalogSkeleton rows={5} />
        </div>
      ) : results.length === 0 ? (
        <CatalogEmpty
          title="Nikto sa nenašiel"
          description="Skús iné meno alebo zruš filter písmena."
          resetHref="/authors"
        />
      ) : (
        <VirtualOrderedList
          ref={listRef}
          aria-label="Zoznam autorov"
          aria-busy={isPending || undefined}
          className={`relative mt-4 border-y border-rule pb-20 transition-opacity duration-200 dark:border-white/10 ${isPending ? "opacity-55" : "opacity-100"}`}
          $height={virtualizer.getTotalSize()}
        >
          {virtualRows.map((virtualRow) => {
            const author = results[virtualRow.index];
            if (!author) return null;
            const index = virtualRow.index;
            const initial = author.name.charAt(0).toUpperCase();
            return (
              <VirtualRow
                key={author.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute inset-x-0 top-0 border-b border-rule dark:border-white/10"
                $start={virtualRow.start - scrollMargin}
              >
                <Link
                  href={`/authors/${author.id}`}
                  className="group relative grid grid-cols-[3.25rem_minmax(0,1fr)] items-stretch gap-4 py-6 transition sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-8 sm:py-7 md:gap-10"
                >
                  <AccentFillDiv
                    $color={author.accent}
                    className="relative flex items-center justify-center self-stretch overflow-hidden"
                    aria-hidden
                  >
                    <span className="font-display text-3xl leading-none text-white/90 sm:text-5xl">
                      {initial}
                    </span>
                    <ShadeOverlay className="pointer-events-none absolute inset-0 opacity-25" />
                  </AccentFillDiv>

                  <div className="min-w-0 self-center pr-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-display text-[clamp(1.45rem,3.5vw,2.15rem)] leading-[1.05] tracking-tight text-ink transition group-hover:text-sage">
                        {author.name}
                      </h2>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                        {author.nationality}
                        {author.birthYear ? ` · ${author.birthYear}` : null}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:text-[15px]">
                      {author.bio}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground tabular-nums uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink transition group-hover:text-sage">
                      Profil
                      <ArrowUpRight
                        className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </span>
                  </div>

                  <span
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                </Link>
              </VirtualRow>
            );
          })}
        </VirtualOrderedList>
      )}

      <CatalogLoadMore
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadedCount={results.length}
        onLoadMore={() => void loadMore()}
        itemLabel="autorov"
        loadingLabel="Načítavam ďalších autorov…"
        ariaLabel="Načítať ďalších autorov"
      />
    </>
  );
}
