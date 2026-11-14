"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpRight } from "lucide-react";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogChipRow } from "@/components/catalog/CatalogChipRow";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { useDebouncedCatalogAction } from "@/hooks/use-debounced-catalog-action";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import {
  searchAuthorsAction,
  type SearchAuthorsResult,
} from "@/lib/catalog/actions";
import type { CatalogAuthor } from "@/lib/catalog";
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
  const listRef = useRef<HTMLOListElement>(null);
  const scrollMargin = useWindowScrollMargin(listRef, [results.length, letter, liveQuery]);
  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 148,
    overscan: 8,
    scrollMargin,
  });

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Autori" }]}
      />

      <CatalogTopBar
        title="Autori fondu"
        lead="Register mien zo školského fondu. Klikni na meno — otvorí sa profil a tituly."
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
              Index
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
              {isPending ? <span className="ml-2 text-xs">· hľadám…</span> : null}
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
              "shrink-0 border-b-2 px-1 pb-2 text-sm transition",
              !letter
                ? "border-accent font-semibold text-ink"
                : "border-transparent text-muted-foreground hover:text-ink",
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
                  "shrink-0 border-b-2 px-1.5 pb-2 font-mono text-sm transition",
                  active
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink",
                )}
                aria-current={active ? "true" : undefined}
              >
                {item}
              </Link>
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
        <ol
          ref={listRef}
          className="relative mt-4 border-y border-rule pb-20 dark:border-white/10"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const author = results[virtualRow.index];
            const index = virtualRow.index;
            const initial = author.name.charAt(0).toUpperCase();
            return (
              <li
                key={author.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute inset-x-0 top-0 border-b border-rule dark:border-white/10"
                style={{
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                }}
              >
                <Link
                  href={`/authors/${author.id}`}
                  className="group relative grid grid-cols-[3.25rem_minmax(0,1fr)] items-stretch gap-4 py-6 transition sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-8 sm:py-7 md:gap-10"
                >
                  <div
                    className="relative flex items-center justify-center self-stretch overflow-hidden"
                    style={{ background: author.accent }}
                    aria-hidden
                  >
                    <span className="font-display text-3xl leading-none text-white/90 sm:text-5xl">
                      {initial}
                    </span>
                    <span
                      className="pointer-events-none absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          "linear-gradient(160deg, transparent 30%, rgba(0,0,0,0.35))",
                      }}
                    />
                  </div>

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
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
