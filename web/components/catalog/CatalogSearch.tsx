"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_CATEGORIES } from "@/lib/catalog-mock";

type CatalogSearchProps = {
  /** Base path for query sync (defaults to current pathname) */
  action?: string;
  defaultQuery?: string;
  defaultCategory?: string;
  placeholder?: string;
  showCategory?: boolean;
  hiddenFields?: Record<string, string>;
  /** Live fuse filter callback (frontend search) */
  onQueryChange?: (query: string) => void;
  debounceMs?: number;
};

export function CatalogSearch({
  action,
  defaultQuery = "",
  defaultCategory = "",
  placeholder = "Názov, autor alebo téma…",
  showCategory = true,
  hiddenFields,
  onQueryChange,
  debounceMs = 180,
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState(defaultCategory);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const basePath = action ?? pathname;

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  const syncUrl = useEffectEvent(
    (nextQuery: string, nextCategory: string, replace: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      const trimmed = nextQuery.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");

      if (showCategory) {
        if (nextCategory) params.set("category", nextCategory);
        else params.delete("category");
      }

      if (hiddenFields) {
        for (const [key, value] of Object.entries(hiddenFields)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
      }

      const qs = params.toString();
      const href = qs ? `${basePath}?${qs}` : basePath;
      startTransition(() => {
        if (replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
  );

  const emitQuery = useEffectEvent((value: string) => {
    onQueryChange?.(value);
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    emitQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncUrl(value, category, true);
    }, debounceMs);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    emitQuery(query);
    syncUrl(query, category, false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
      role="search"
    >
      <div className="min-w-0 flex-1">
        <Label htmlFor="catalog-q" className="sr-only">
          Hľadanie
        </Label>
        <div className="flex overflow-hidden rounded-full border border-rule bg-paper-deep focus-within:border-ink focus-within:ring-2 focus-within:ring-accent/60 dark:border-white/15 dark:focus-within:border-accent">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.7}
              aria-hidden
            />
            <Input
              id="catalog-q"
              name="q"
              value={query}
              onValueChange={handleQueryChange}
              placeholder={placeholder}
              autoComplete="off"
              className="h-12 rounded-none border-0 bg-transparent pr-3 pl-11 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            type="submit"
            className="h-12 shrink-0 rounded-none rounded-r-full bg-accent px-5 text-black hover:bg-accent-deep sm:px-6"
          >
            Hľadať
          </Button>
        </div>
      </div>

      {showCategory ? (
        <div className="w-full sm:w-48">
          <Label htmlFor="catalog-category" className="sr-only">
            Kategória
          </Label>
          <select
            id="catalog-category"
            name="category"
            value={category}
            onChange={(event) => {
              const next = event.target.value;
              setCategory(next);
              syncUrl(query, next, true);
            }}
            className="border-rule bg-paper-deep h-12 w-full rounded-full border px-4 text-sm outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-accent/60 dark:border-white/15"
          >
            <option value="">Všetky kategórie</option>
            {MOCK_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </form>
  );
}
