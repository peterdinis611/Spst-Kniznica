"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 420;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-40 transition duration-300 sm:right-6 sm:bottom-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              className={cn(
                "pointer-events-auto size-11 rounded-full border border-ink bg-accent text-accent-foreground shadow-[4px_4px_0_rgba(0,0,0,0.18)]",
                "hover:bg-accent-deep dark:border-white/20 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]",
                !visible && "pointer-events-none",
              )}
              aria-label="Späť nahor"
              tabIndex={visible ? 0 : -1}
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            />
          }
        >
          <ArrowUp className="size-4" strokeWidth={2} aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="left">Späť nahor</TooltipContent>
      </Tooltip>
    </div>
  );
}
