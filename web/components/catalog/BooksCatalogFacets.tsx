"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, SlidersHorizontal, X } from "@/components/icons";
import { useBooksCatalogQuery } from "@/hooks/use-books-catalog-query";
import type { BooksCatalogFilters } from "@/lib/catalog/catalog-url";
import type { CatalogAuthor, CatalogCategory } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type BooksCatalogFacetsProps = {
  filters: BooksCatalogFilters;
  liveQuery: string;
  categories: CatalogCategory[];
  authors: CatalogAuthor[];
  filterCount: number;
  resultCount: number;
  resultsPending?: boolean;
  onOpenAdvanced: () => void;
  filtersOpen?: boolean;
};

function foldDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function commandFilter(value: string, search: string): number {
  const needle = foldDiacritics(search.trim());
  if (!needle) return 1;
  return foldDiacritics(value).includes(needle) ? 1 : 0;
}

function slovakCountLabel(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  if (count === 1) return `1 ${one}`;
  if (count >= 2 && count <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

type MultiComboboxProps = {
  label: string;
  ariaLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  allLabel: string;
  selectedAriaLabel: string;
  triggerEmpty: string;
  countLabel: (count: number) => string;
  items: Array<{ id: string; name: string; bookCount?: number }>;
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  groupHeading: string;
};

function MultiCombobox({
  label,
  ariaLabel,
  searchPlaceholder,
  emptyLabel,
  allLabel,
  selectedAriaLabel,
  triggerEmpty,
  countLabel,
  items,
  selectedIds,
  onChange,
  groupHeading,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  const triggerLabel =
    selected.length === 0
      ? triggerEmpty
      : selected.length === 1
        ? selected[0]!.name
        : countLabel(selected.length);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
          {label}
        </p>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition hover:text-ink"
          >
            Vymazať
          </button>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel}
              className={cn(
                "h-12 w-full justify-between rounded-none border-rule bg-card/60 px-3.5 font-normal shadow-none transition dark:border-white/12 dark:bg-paper-deep/50",
                "hover:border-sage/45 hover:bg-card dark:hover:border-sage/35",
                open && "border-sage/50 ring-1 ring-sage/25",
                selected.length > 0 && "border-sage/35 bg-mint/15 dark:bg-paper-deep",
              )}
            />
          }
        >
          <span className="min-w-0 truncate text-left text-[15px]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{triggerLabel}</span>
            ) : (
              <span className="text-ink">{triggerLabel}</span>
            )}
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
            aria-hidden
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[min(100vw-2rem,22rem)] rounded-none border border-rule p-0 shadow-[0_24px_48px_-28px_rgba(14,26,36,0.65)] dark:border-white/12"
          initialFocus={() =>
            document.querySelector<HTMLElement>("[data-slot=command-input]")
          }
        >
          <Command
            className="rounded-none bg-paper dark:bg-paper-deep"
            filter={commandFilter}
          >
            <CommandInput placeholder={searchPlaceholder} className="h-11" />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup heading={groupHeading}>
                <CommandItem
                  value={`${allLabel} all`}
                  data-checked={selectedIds.length === 0 ? true : undefined}
                  onSelect={() => {
                    onChange([]);
                    setOpen(false);
                  }}
                  className="rounded-none"
                >
                  {allLabel}
                </CommandItem>
                {items.map((item) => {
                  const active = selectedIds.includes(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.name} ${foldDiacritics(item.name)}`}
                      data-checked={active ? true : undefined}
                      onSelect={() => toggle(item.id)}
                      className="rounded-none"
                    >
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      {item.bookCount && item.bookCount > 0 ? (
                        <span className="mr-6 font-mono text-[10px] text-muted-foreground tabular-nums">
                          {item.bookCount}
                        </span>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <ul
          className="mt-2.5 flex flex-wrap gap-1.5"
          aria-label={selectedAriaLabel}
        >
          {selected.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onChange(selectedIds.filter((id) => id !== item.id))
                }
                className="group inline-flex h-7 max-w-full items-center gap-1.5 border border-sage/30 bg-mint/25 pr-1.5 pl-2.5 text-[12px] text-ink transition hover:border-sage hover:bg-mint/45 dark:bg-paper-deep"
                aria-label={`Odstrániť ${item.name}`}
              >
                <span className="truncate">{item.name}</span>
                <span className="grid size-5 place-items-center text-muted-foreground transition group-hover:text-ink">
                  <X className="size-3" strokeWidth={2} aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BooksCatalogFacets({
  filters,
  liveQuery,
  categories,
  authors,
  filterCount,
  resultCount,
  resultsPending = false,
  onOpenAdvanced,
  filtersOpen = false,
}: BooksCatalogFacetsProps) {
  const { setFilters } = useBooksCatalogQuery();
  const selectedCategoryIds = filters.categories ?? [];
  const selectedAuthorIds = filters.authors ?? [];
  const activePickCount =
    selectedCategoryIds.length +
    selectedAuthorIds.length +
    (filters.available ? 1 : 0) +
    filterCount;

  function push(next: Partial<BooksCatalogFilters>) {
    void setFilters(
      {
        q: liveQuery.trim() || undefined,
        ...next,
      },
      { history: "push" },
    );
  }

  return (
    <section
      className="relative overflow-hidden border border-rule bg-card/40 dark:border-white/10 dark:bg-paper-deep/35"
      data-tour="books-facets"
      aria-label="Filtre katalógu"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-sage/70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-sage/10 blur-3xl"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-3 border-b border-rule/80 px-4 py-3 sm:px-5 dark:border-white/10">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            Filter rail
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activePickCount > 0
              ? `${slovakCountLabel(activePickCount, "aktívny filter", "aktívne filtre", "aktívnych filtrov")}`
              : "Zúž fond podľa témy, autora alebo dostupnosti"}
          </p>
        </div>
        <p className="font-display text-2xl leading-none tracking-tight text-ink tabular-nums">
          {resultsPending ? "…" : resultCount}
          <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">
            {resultCount === 1 && !resultsPending ? "titul" : "titulov"}
          </span>
        </p>
      </div>

      <div className="relative grid gap-5 px-4 py-5 sm:px-5 md:grid-cols-2 md:gap-6">
        <MultiCombobox
          label="Kategória"
          ariaLabel="Vybrať kategórie"
          searchPlaceholder="Hľadaj kategóriu…"
          emptyLabel="Žiadna kategória."
          allLabel="Všetky kategórie"
          selectedAriaLabel="Vybrané kategórie"
          triggerEmpty="Vybrať kategórie…"
          countLabel={(count) =>
            slovakCountLabel(count, "kategória", "kategórie", "kategórií")
          }
          items={categories}
          selectedIds={selectedCategoryIds}
          onChange={(next) =>
            push({ categories: next.length ? next : undefined })
          }
          groupHeading="Fond"
        />

        <MultiCombobox
          label="Autor"
          ariaLabel="Vybrať autorov"
          searchPlaceholder="Hľadaj autora…"
          emptyLabel="Žiadny autor."
          allLabel="Všetci autori"
          selectedAriaLabel="Vybraní autori"
          triggerEmpty="Vybrať autorov…"
          countLabel={(count) =>
            slovakCountLabel(count, "autor", "autori", "autorov")
          }
          items={authors}
          selectedIds={selectedAuthorIds}
          onChange={(next) =>
            push({ authors: next.length ? next : undefined })
          }
          groupHeading="Autori"
        />
      </div>

      <div className="relative flex flex-wrap items-center gap-2 border-t border-rule/80 px-4 py-3.5 sm:px-5 dark:border-white/10">
        <button
          type="button"
          onClick={() =>
            push({ available: filters.available ? false : true })
          }
          className={cn(
            "inline-flex h-10 items-center gap-2.5 border px-3 text-sm transition",
            filters.available
              ? "border-sage/50 bg-mint/35 font-medium text-ink dark:bg-paper-deep"
              : "border-rule bg-transparent text-muted-foreground hover:border-sage/40 hover:text-ink dark:border-white/12",
          )}
          aria-pressed={Boolean(filters.available)}
          aria-label={
            filters.available
              ? "Filtrovať: len dostupné tituly (aktívny)"
              : "Filtrovať: len dostupné tituly"
          }
        >
          <span
            className={cn(
              "grid size-4 place-items-center border transition",
              filters.available
                ? "border-sage bg-sage text-paper"
                : "border-rule dark:border-white/20",
            )}
            aria-hidden
          >
            {filters.available ? (
              <Check className="size-3" strokeWidth={3} />
            ) : null}
          </span>
          Len dostupné
        </button>

        <Button
          type="button"
          variant="outline"
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          aria-label={
            filterCount > 0
              ? `Ďalšie filtre: rok, jazyk a trakt (${filterCount} aktívnych)`
              : "Ďalšie filtre: rok, jazyk a trakt"
          }
          className={cn(
            "h-10 rounded-none border-rule bg-transparent shadow-none dark:border-white/12",
            "hover:border-sage/40 hover:bg-mint/20",
            filterCount > 0 && "border-sage/45 bg-mint/20",
          )}
          onClick={onOpenAdvanced}
        >
          <SlidersHorizontal
            className="size-3.5 text-sage"
            strokeWidth={1.8}
            aria-hidden
          />
          Rok & jazyk
          {filterCount > 0 ? (
            <span className="ml-1 grid min-w-5 place-items-center bg-sage px-1.5 py-0.5 font-mono text-[10px] text-paper tabular-nums">
              {filterCount}
            </span>
          ) : (
            <span className="text-muted-foreground">…</span>
          )}
        </Button>
      </div>
    </section>
  );
}
