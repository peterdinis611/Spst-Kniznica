"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CatalogChipRow({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <ScrollArea className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={label}
        className="flex w-max max-w-none gap-2 pb-2.5"
      >
        {children}
      </div>
    </ScrollArea>
  );
}
