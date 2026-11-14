"use client";

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
    <div
      className={cn(
        "w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={label}
        className="flex w-max max-w-none gap-2 pb-1"
      >
        {children}
      </div>
    </div>
  );
}
