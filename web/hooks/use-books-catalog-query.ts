"use client";

import { useMemo } from "react";
import { useQueryStates } from "nuqs";
import {
  booksCatalogParsers,
  booksFiltersFromQuery,
  booksQueryPatchFromFilters,
  type BooksCatalogFilters,
} from "@/lib/catalog/catalog-url";

const catalogQueryOptions = {
  history: "push" as const,
  scroll: false,
};

export function useBooksCatalogQuery() {
  const [state, setState] = useQueryStates(
    booksCatalogParsers,
    catalogQueryOptions,
  );

  const filters = useMemo(() => booksFiltersFromQuery(state), [state]);

  function setFilters(
    patch: Partial<BooksCatalogFilters>,
    options?: { history?: "push" | "replace" },
  ) {
    return setState(booksQueryPatchFromFilters(patch), {
      ...catalogQueryOptions,
      ...options,
    });
  }

  return { filters, setFilters, queryState: state, setQueryState: setState };
}
