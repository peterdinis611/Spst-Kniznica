"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CatalogFilterChipProps = {
  href: string;
  active: boolean;
  children: React.ReactNode;
};

export function CatalogFilterChip({
  href,
  active,
  children,
}: CatalogFilterChipProps) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn(
        "shrink-0 rounded-full",
        active
          ? "bg-accent text-accent-foreground hover:bg-accent-deep"
          : "border-rule bg-paper-deep text-muted-foreground hover:border-sage/40 hover:text-ink dark:border-white/10",
      )}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}
