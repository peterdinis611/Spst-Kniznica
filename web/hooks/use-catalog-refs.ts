"use client";

import { useEffect, useState } from "react";
import {
  loadCatalogRefs,
  type CatalogBookRef,
} from "@/lib/catalog/load-catalog-refs";

/**
 * Loads catalog id/title/author map after paint so route navigation stays instant.
 */
export function useCatalogRefs() {
  const [catalog, setCatalog] = useState<CatalogBookRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const refs = await loadCatalogRefs();
        if (!cancelled) setCatalog(refs);
      } catch {
        // Titles stay unresolved; desk still works with book ids.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog };
}
