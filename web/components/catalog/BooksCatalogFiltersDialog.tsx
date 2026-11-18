"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "@/components/icons";
import { useBooksCatalogQuery } from "@/hooks/use-books-catalog-query";
import {
  languageFilterLabel,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ShelfZone = { id: string; label: string };

const LANGUAGE_PRESETS = [
  { code: "sk", label: "Slovenčina" },
  { code: "en", label: "Angličtina" },
  { code: "cs", label: "Čeština" },
  { code: "de", label: "Nemčina" },
] as const;

const PRESET_CODES = new Set(LANGUAGE_PRESETS.map((item) => item.code));

function isPresetLanguage(code: string | undefined): boolean {
  if (!code) return false;
  return PRESET_CODES.has(code.toLowerCase() as (typeof LANGUAGE_PRESETS)[number]["code"]);
}

type BooksCatalogFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: BooksCatalogFilters;
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
      aria-pressed={active}
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
  shelfZones,
  searchQuery,
}: BooksCatalogFiltersDialogProps) {
  const { setFilters } = useBooksCatalogQuery();
  const [draft, setDraft] = useState<BooksCatalogFilters>(applied);
  const [customLanguage, setCustomLanguage] = useState("");
  const [yearDraft, setYearDraft] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(applied);
      setYearDraft(applied.year != null ? String(applied.year) : "");
      const lang = applied.language?.trim();
      setCustomLanguage(lang && !isPresetLanguage(lang) ? lang : "");
    }
  }, [open, applied]);

  function patch(next: Partial<BooksCatalogFilters>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function apply() {
    const customLang = customLanguage.trim();
    const language =
      draft.language ?? (customLang.length > 0 ? customLang : undefined);
    const yearParsed = yearDraft.trim()
      ? Number.parseInt(yearDraft.trim(), 10)
      : undefined;
    const year =
      yearParsed != null && Number.isFinite(yearParsed)
        ? yearParsed
        : undefined;

    void setFilters(
      {
        shelf: draft.shelf,
        year,
        language,
        q: searchQuery?.trim() || undefined,
      },
      { history: "push" },
    );
    onOpenChange(false);
  }

  function reset() {
    setDraft((prev) => ({
      ...prev,
      shelf: undefined,
      year: undefined,
      language: undefined,
    }));
    setYearDraft("");
    setCustomLanguage("");
  }

  const dirty =
    draft.shelf !== applied.shelf ||
    draft.year !== applied.year ||
    draft.language !== applied.language ||
    yearDraft.trim() !==
      (applied.year != null ? String(applied.year) : "") ||
    customLanguage.trim() !==
      (applied.language && !isPresetLanguage(applied.language)
        ? applied.language.trim()
        : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,42rem)] max-w-md flex-col gap-0 overflow-hidden border-rule bg-card p-0 dark:bg-surface-3 sm:max-w-lg">
        <DialogHeader className="border-b border-rule px-5 py-4 text-left dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SlidersHorizontal className="size-4 text-sage" aria-hidden />
            Rok, jazyk & trakt
          </DialogTitle>
          <DialogDescription>
            Doplnkové filtre. Kategóriu, autora a dostupnosť nastavíš priamo v
            katalógu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <fieldset className="space-y-3">
            <legend className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Rok
            </legend>
            <Label htmlFor="filters-year" className="sr-only">
              Rok vydania
            </Label>
            <Input
              id="filters-year"
              type="number"
              inputMode="numeric"
              min={1000}
              max={2100}
              value={yearDraft}
              onChange={(e) => {
                setYearDraft(e.target.value);
                const raw = e.target.value.trim();
                if (!raw) {
                  patch({ year: undefined });
                  return;
                }
                const n = Number.parseInt(raw, 10);
                patch({ year: Number.isFinite(n) ? n : undefined });
              }}
              placeholder="napr. 2019"
              className="h-10 rounded-none border-rule bg-paper dark:border-white/15 dark:bg-paper-deep"
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Jazyk
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <FilterOption
                active={!draft.language && !customLanguage.trim()}
                onClick={() => {
                  patch({ language: undefined });
                  setCustomLanguage("");
                }}
              >
                Všetky jazyky
              </FilterOption>
              {LANGUAGE_PRESETS.map((item) => (
                <FilterOption
                  key={item.code}
                  active={draft.language?.toLowerCase() === item.code}
                  onClick={() => {
                    patch({ language: item.code });
                    setCustomLanguage("");
                  }}
                >
                  {item.label}
                </FilterOption>
              ))}
            </div>
            <div>
              <Label
                htmlFor="filters-lang-custom"
                className="text-xs text-muted-foreground"
              >
                Iný jazyk (kód alebo názov)
              </Label>
              <Input
                id="filters-lang-custom"
                value={customLanguage}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomLanguage(value);
                  const trimmed = value.trim();
                  if (!trimmed) {
                    if (!isPresetLanguage(draft.language)) {
                      patch({ language: undefined });
                    }
                    return;
                  }
                  if (!isPresetLanguage(trimmed)) {
                    patch({ language: trimmed });
                  }
                }}
                placeholder="napr. fr, hu…"
                className="mt-1.5 h-10 rounded-none border-rule bg-paper dark:border-white/15 dark:bg-paper-deep"
              />
              {draft.language && !isPresetLanguage(draft.language) ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Aktívny: {languageFilterLabel(draft.language)}
                </p>
              ) : null}
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
            disabled={
              !draft.shelf &&
              draft.year == null &&
              !draft.language &&
              !yearDraft.trim() &&
              !customLanguage.trim()
            }
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
