"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TrendingBooksControlsProps = {
  children?: ReactNode;
  placement?: "header" | "mobile";
};

function scrollTrending(dir: -1 | 1) {
  const node = document.querySelector<HTMLElement>("[data-trending-scroller]");
  if (!node) return;
  node.scrollBy({
    left: dir * Math.min(320, node.clientWidth * 0.7),
    behavior: "smooth",
  });
}

export function TrendingBooksControls({
  children,
  placement = "header",
}: TrendingBooksControlsProps) {
  if (placement === "mobile") {
    return (
      <div className="mt-6 flex justify-center gap-2 sm:hidden">
        <Button
          variant="outline"
          size="icon"
          className="size-10 rounded-none border-ink"
          onClick={() => scrollTrending(-1)}
          aria-label="Predchádzajúce"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-10 rounded-none border-ink"
          onClick={() => scrollTrending(1)}
          aria-label="Ďalšie"
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        size="icon"
        className="hidden size-10 rounded-none border-ink sm:inline-flex"
        onClick={() => scrollTrending(-1)}
        aria-label="Predchádzajúce"
      >
        <ArrowLeft className="size-4" />
      </Button>

      {children}

      <Button
        variant="outline"
        size="icon"
        className="hidden size-10 rounded-none border-ink sm:inline-flex"
        onClick={() => scrollTrending(1)}
        aria-label="Ďalšie"
      >
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
