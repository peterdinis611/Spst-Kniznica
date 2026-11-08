import Link from "next/link";
import { FlatCover } from "@/components/landing/FlatCover";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MockBook } from "@/lib/catalog-mock";

type BookCardProps = {
  book: MockBook;
  index?: number;
};

export function BookCard({ book, index = 0 }: BookCardProps) {
  const ratio = book.totalCopies
    ? book.availableCopies / book.totalCopies
    : 0;
  const stockLabel =
    book.availableCopies === 0
      ? "Nedostupné"
      : ratio <= 0.35
        ? "Málo kusov"
        : "Dostupné";
  const stockClass =
    book.availableCopies === 0
      ? "border-rule bg-paper text-muted-foreground"
      : ratio <= 0.35
        ? "border-stair-1/40 bg-stair-1/15 text-stair-1"
        : "border-transparent bg-accent text-black";
  const stockHint =
    book.availableCopies === 0
      ? "Momentálne nie je voľný exemplár"
      : `${book.availableCopies} z ${book.totalCopies} exemplárov je voľných`;

  return (
    <li
      className="reveal h-full"
      style={{ animationDelay: `${(index % 8) * 0.04}s` }}
    >
      <Card
        size="sm"
        className="relative h-full gap-0 rounded-none bg-paper-deep/40 py-0 ring-rule transition duration-300 hover:-translate-y-1 hover:ring-ink/40 dark:bg-paper-deep/20 dark:ring-white/10 dark:hover:ring-white/25"
      >
        <Link href={`/books/${book.id}`} className="group flex h-full flex-col">
          <div className="overflow-hidden bg-black/5 p-4 sm:p-5 dark:bg-white/5">
            <div className="mx-auto w-[78%] max-w-[10.5rem] transition duration-300 group-hover:scale-[1.02]">
              <FlatCover
                title={book.title}
                author={book.author}
                accent={book.accent}
                secondary={book.secondary}
                className="shadow-[6px_10px_0_rgba(0,0,0,0.18)] dark:shadow-[6px_10px_0_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>

          <CardHeader className="gap-1.5 px-4 pt-3 pb-0 sm:px-5">
            <CardTitle className="font-display text-lg leading-snug text-ink sm:text-xl">
              {book.title}
            </CardTitle>
            <CardDescription>{book.author}</CardDescription>
          </CardHeader>

          <CardFooter className="mt-auto justify-between gap-2 border-t-0 bg-transparent px-4 pt-3 pb-4 text-xs sm:px-5 sm:pb-5">
            <span className="truncate tracking-[0.1em] text-muted-foreground uppercase">
              {book.categoryName}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-ink">
              {book.availableCopies}/{book.totalCopies} ks
            </span>
          </CardFooter>
        </Link>

        <div className="absolute top-3 right-3 z-10">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <Badge
                className={`h-auto rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${stockClass}`}
              >
                {stockLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left">{stockHint}</TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </li>
  );
}
