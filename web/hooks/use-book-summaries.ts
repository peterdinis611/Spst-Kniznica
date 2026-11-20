"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBookSummaries } from "@/lib/catalog/book-summaries";
import type { CatalogBookRef } from "@/lib/catalog/load-catalog-refs";

/** Loads titles for the given book ids via POST /api/books/summaries. */
export function useBookSummaries(ids: string[]) {
  const key = useMemo(
    () =>
      [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
        .sort()
        .join(","),
    [ids],
  );
  const [catalog, setCatalog] = useState<CatalogBookRef[]>([]);

  useEffect(() => {
    if (!key) {
      setCatalog([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const refs = await fetchBookSummaries(key.split(","));
        if (!cancelled) setCatalog(refs);
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { catalog };
}
