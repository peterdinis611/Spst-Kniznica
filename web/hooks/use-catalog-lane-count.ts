"use client";

import { useEffect, useState } from "react";

/** 1 column by default, 2 from `sm` — for authors/categories-style lists. */
export function useCatalogLaneCount(smMinWidth = 640) {
  const [lanes, setLanes] = useState(1);

  useEffect(() => {
    const sm = window.matchMedia(`(min-width: ${smMinWidth}px)`);
    const sync = () => setLanes(sm.matches ? 2 : 1);
    sync();
    sm.addEventListener("change", sync);
    return () => sm.removeEventListener("change", sync);
  }, [smMinWidth]);

  return lanes;
}
