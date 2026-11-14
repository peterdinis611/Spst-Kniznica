"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  buildBooksCatalogHref,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
import type { CatalogAuthor } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShelfZone = { id: string; label: string };

type BooksCatalogFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: BooksCatalogFilters;
  authors: CatalogAuthor[];
  shelfZones: ShelfZone[];
  searchQuery?: string;
};

function FilterOption({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm border px-3 py-2 text-left text-sm transition",
        active
          ? "border-sage/50 bg-mint/45 text-ink dark:bg-paper-deep"
          : "border-rule bg-paper/40 text-muted-foreground hover:border-sage/35 hover:text-ink dark:border-white/12 dark:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BooksCatalogFiltersDialog({
  open,
  onOpenChange,
  applied,
  authors,
  shelfZones,
  searchQuery,
}: BooksCatalogFiltersDialogProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<BooksCatalogFilters>(applied);
  const [authorQuery, setAuthorQuery] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(applied);
      setAuthorQuery("");
    }
  }, [open, applied]);

  const filteredAuthors = useMemo(() => {
    const q = authorQuery.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter((a) => a.name.toLowerCase().includes(q));
  }, [authors, authorQuery]);

  function patch(next: Partial<BooksCatalogFilters>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function apply() {
    router.push(
      buildBooksCatalogHref({
        ...applied,
        author: draft.author,
        shelf: draft.shelf,
        q: searchQuery?.trim() || undefined,
      }),
    );
    onOpenChange(false);
  }

  function reset() {
    setDraft((prev) => ({
      ...prev,
      author: undefined,
      shelf: undefined,
    }));
  }

  const dirty =
    draft.author !== applied.author || draft.shelf !== applied.shelf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,42rem)] max-w-md flex-col gap-0 overflow-hidden border-rule bg-card p-0 dark:bg-surface-3 sm:max-w-lg">
        <DialogHeader className="border-b border-rule px-5 py-4 text-left dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SlidersHorizontal className="size-4 text-sage" aria-hidden />
            Autor & trakt
          </DialogTitle>
          <DialogDescription>
            Doplnkové filtre. Kategóriu a dostupnosť nastavíš priamo v katalógu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <fieldset className="space-y-3">
            <legend className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Autor
            </legend>
            <Input
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
              placeholder="Hľadať meno autora…"
              className="h-10 rounded-none border-rule bg-paper dark:border-white/15 dark:bg-paper-deep"
            />
            <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
              <FilterOption
                active={!draft.author}
                onClick={() => patch({ author: undefined })}
                className="w-full"
              >
                Všetci autori
              </FilterOption>
              {filteredAuthors.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
                  Žiadny autor na „{authorQuery.trim()}“.
                </p>
              ) : (
                filteredAuthors.map((item) => (
                  <FilterOption
                    key={item.id}
                    active={draft.author === item.id}
                    onClick={() => patch({ author: item.id })}
                    className="w-full"
                  >
                    {item.name}
                  </FilterOption>
                ))
              )}
            </div>
          </fieldset>

          {shelfZones.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Sektor v knižnici
              </legend>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Podľa kódu poličky (napr. E-12). Nie je to isté ako tematická
                kategória knihy.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <FilterOption
                  active={!draft.shelf}
                  onClick={() => patch({ shelf: undefined })}
                >
                  Celý fond
                </FilterOption>
                {shelfZones.map((item) => (
                  <FilterOption
                    key={item.id}
                    active={draft.shelf === item.id}
                    onClick={() => patch({ shelf: item.id })}
                  >
                    <span className="font-mono font-semibold">{item.id}</span>
                    <span className="mt-0.5 block text-xs opacity-75">
                      {item.label}
                    </span>
                  </FilterOption>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-rule bg-paper-deep/40 px-5 py-4 sm:flex-row sm:justify-between dark:border-white/10 dark:bg-paper-deep/20">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-none text-muted-foreground"
            onClick={reset}
            disabled={!draft.author && !draft.shelf}
          >
            Vymazať výber
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-none border-rule sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Zrušiť
            </Button>
            <Button
              type="button"
              className="h-10 flex-1 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep sm:min-w-[9rem]"
              onClick={apply}
              disabled={!dirty}
            >
              Použiť
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
