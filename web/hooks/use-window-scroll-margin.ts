"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/** Document offset of a list root for `useWindowVirtualizer` scrollMargin. */
export function useWindowScrollMargin(
  ref: RefObject<HTMLElement | null>,
  deps: readonly unknown[] = [],
) {
  const [margin, setMargin] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setMargin(el.offsetTop);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass explicit deps
  }, deps);

  return margin;
}
