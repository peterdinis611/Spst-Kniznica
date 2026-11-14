"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { destroyAppTour, startAppTour } from "@/lib/tour/app-tour";

export function AppTourTrigger() {
  const pathname = usePathname();

  useEffect(() => {
    destroyAppTour();
  }, [pathname]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-tour="tour-trigger"
      className="hidden h-10 rounded-full border-rule px-3 text-xs font-semibold tracking-wide sm:inline-flex dark:border-white/25"
      onClick={() => startAppTour()}
      aria-label="Spustiť prehliadku aplikácie"
    >
      <Sparkles className="size-3.5 text-sage" aria-hidden />
      Prehliadka
    </Button>
  );
}
