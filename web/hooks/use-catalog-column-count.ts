"use client";

import { useEffect, useState } from "react";

/** Matches books catalog grid: 2 → sm:3 → md:4. */
export function useCatalogColumnCount() {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const sm = window.matchMedia("(min-width: 640px)");
    const md = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      if (md.matches) setColumns(4);
      else if (sm.matches) setColumns(3);
      else setColumns(2);
    };

    sync();
    sm.addEventListener("change", sync);
    md.addEventListener("change", sync);
    return () => {
      sm.removeEventListener("change", sync);
      md.removeEventListener("change", sync);
    };
  }, []);

  return columns;
}
