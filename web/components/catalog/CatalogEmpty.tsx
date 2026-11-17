import Link from "next/link";
import { SearchX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type CatalogEmptyProps = {
  title: string;
  description: string;
  resetHref: string;
  resetLabel?: string;
};

export function CatalogEmpty({
  title,
  description,
  resetHref,
  resetLabel = "Resetovať filtre",
}: CatalogEmptyProps) {
  return (
    <Empty
      role="status"
      aria-live="polite"
      className="mt-10 border border-dashed border-rule py-16 dark:border-white/15"
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-paper-deep text-ink"
          aria-hidden
        >
          <SearchX strokeWidth={1.7} aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-display text-2xl text-ink">
          {title}
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
          render={<Link href={resetHref} />}
        >
          {resetLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
