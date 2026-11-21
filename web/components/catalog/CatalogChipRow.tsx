"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CatalogChipRow({
  children,
  className,
  label,
  showControls = true,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  /** Prev/next arrows when content overflows. Default true. */
  showControls?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    const left = node.scrollLeft;
    setCanPrev(left > 2);
    setCanNext(max > 2 && left < max - 2);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    updateEdges();
    node.addEventListener("scroll", updateEdges, { passive: true });

    const track = node.firstElementChild;
    const resize = new ResizeObserver(updateEdges);
    resize.observe(node);
    if (track instanceof HTMLElement) resize.observe(track);

    return () => {
      node.removeEventListener("scroll", updateEdges);
      resize.disconnect();
    };
  }, [updateEdges, children]);

  const scrollByDir = (dir: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    const step = Math.min(280, Math.max(160, node.clientWidth * 0.65));
    node.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const overflow = canPrev || canNext;

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      {showControls && overflow ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center gap-1 bg-gradient-to-l from-paper from-40% to-transparent pl-12 dark:from-[var(--paper)]">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="pointer-events-auto size-8 rounded-none border-rule bg-paper shadow-sm disabled:opacity-35 dark:border-white/20"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
            aria-label="Predošlé"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="pointer-events-auto size-8 rounded-none border-rule bg-paper shadow-sm disabled:opacity-35 dark:border-white/20"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
            aria-label="Ďalšie"
          >
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className={cn(
          "w-full overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [scrollbar-width:thin]",
          "snap-x snap-mandatory",
          overflow && "pr-20",
        )}
      >
        <div
          role="group"
          aria-label={label}
          className="flex w-max max-w-none gap-2"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
