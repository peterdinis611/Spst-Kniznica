"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, SlidersHorizontal, X } from "@/components/icons";
import {
  buildBooksCatalogHref,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
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
  clearLabel: string;
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
  clearLabel,
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
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className="h-11 min-w-[min(100%,18rem)] max-w-md flex-1 justify-between rounded-none border-rule bg-paper-deep/70 px-3 font-normal dark:border-white/15"
              />
            }
          >
            <span className="truncate text-left">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{triggerLabel}</span>
              ) : (
                triggerLabel
              )}
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-[min(100vw-2rem,22rem)] rounded-none border border-rule p-0 shadow-[0_18px_40px_-28px_rgba(14,26,36,0.55)] dark:border-white/15"
            initialFocus={() =>
              document.querySelector<HTMLElement>("[data-slot=command-input]")
            }
          >
            <Command
              className="rounded-none bg-paper dark:bg-paper-deep"
              filter={commandFilter}
            >
              <CommandInput placeholder={searchPlaceholder} className="h-10" />
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
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
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

        {selectedIds.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-none px-2 text-xs text-muted-foreground hover:text-ink"
            onClick={() => onChange([])}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={selectedAriaLabel}>
          {selected.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onChange(selectedIds.filter((id) => id !== item.id))
                }
                className="inline-flex h-8 items-center gap-1.5 border border-sage/40 bg-mint/30 px-2.5 text-xs font-medium text-ink transition hover:border-sage dark:bg-paper-deep"
                aria-label={`Odstrániť ${item.name}`}
              >
                {item.name}
                <X className="size-3 text-muted-foreground" aria-hidden />
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
  onOpenAdvanced,
  filtersOpen = false,
}: BooksCatalogFacetsProps) {
  const router = useRouter();
  const q = liveQuery.trim() || undefined;
  const base = { ...filters, q };
  const selectedCategoryIds = filters.categories ?? [];
  const selectedAuthorIds = filters.authors ?? [];

  function push(next: Partial<BooksCatalogFilters>) {
    router.push(buildBooksCatalogHref({ ...base, ...next }), {
      scroll: false,
    });
  }

  return (
    <div className="space-y-5" data-tour="books-facets">
      <MultiCombobox
        label="Kategória"
        ariaLabel="Vybrať kategórie"
        searchPlaceholder="Hľadaj kategóriu…"
        emptyLabel="Žiadna kategória."
        allLabel="Všetky kategórie"
        clearLabel="Vymazať"
        selectedAriaLabel="Vybrané kategórie"
        triggerEmpty="Vybrať kategórie…"
        countLabel={(count) =>
          slovakCountLabel(count, "kategória", "kategórie", "kategórií")
        }
        items={categories}
        selectedIds={selectedCategoryIds}
        onChange={(categories) =>
          push({ categories: categories.length ? categories : undefined })
        }
        groupHeading="Fond"
      />

      <MultiCombobox
        label="Autor"
        ariaLabel="Vybrať autorov"
        searchPlaceholder="Hľadaj autora…"
        emptyLabel="Žiadny autor."
        allLabel="Všetci autori"
        clearLabel="Vymazať"
        selectedAriaLabel="Vybraní autori"
        triggerEmpty="Vybrať autorov…"
        countLabel={(count) =>
          slovakCountLabel(count, "autor", "autori", "autorov")
        }
        items={authors}
        selectedIds={selectedAuthorIds}
        onChange={(authors) =>
          push({ authors: authors.length ? authors : undefined })
        }
        groupHeading="Autori"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildBooksCatalogHref({
            ...base,
            available: filters.available ? undefined : true,
          })}
          scroll={false}
          className={cn(
            "inline-flex h-10 items-center gap-2 border px-3 text-sm transition",
            filters.available
              ? "border-sage/45 bg-mint/40 font-medium text-ink dark:bg-paper-deep"
              : "border-rule bg-paper-deep/50 text-muted-foreground hover:border-sage/35 hover:text-ink dark:border-white/12",
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
              "grid size-4 place-items-center border",
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
        </Link>

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
            "h-10 rounded-none border-rule bg-paper-deep/60 dark:border-white/15",
            filterCount > 0 && "border-sage/40",
          )}
          onClick={onOpenAdvanced}
        >
          <SlidersHorizontal className="size-4 text-sage" aria-hidden />
          Rok & jazyk…
          {filterCount > 0 ? (
            <span className="ml-1.5 rounded-sm bg-sage/15 px-1.5 py-0.5 font-mono text-[10px] text-sage tabular-nums">
              {filterCount}
            </span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
