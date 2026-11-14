import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookCard } from "@/components/catalog/BookCard";
import { buildBooksCatalogHref } from "@/lib/catalog/catalog-url";
import { searchBooksAction } from "@/lib/catalog/actions";

type AuthorMoreBooksProps = {
  authorId?: string | null;
  authorName: string;
  excludeBookId: string;
};

export async function AuthorMoreBooks({
  authorId,
  authorName,
  excludeBookId,
}: AuthorMoreBooksProps) {
  if (!authorId) return null;

  const result = await searchBooksAction({
    authorId,
    page: 1,
    pageSize: 12,
  });

  const books = (result?.data?.items ?? [])
    .filter((book) => book.id !== excludeBookId)
    .slice(0, 4);

  if (books.length === 0) return null;

  const catalogHref = buildBooksCatalogHref({ author: authorId });

  return (
    <section
      className="mt-14 border-t border-rule pt-10 sm:mt-16 sm:pt-12 dark:border-white/10"
      aria-labelledby="author-more-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Ďalšie z fondu
          </p>
          <h2
            id="author-more-heading"
            className="mt-2 font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-tight tracking-tight text-ink"
          >
            Viac od {authorName}
          </h2>
        </div>

        <Link
          href={catalogHref}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-sage transition hover:text-ink"
        >
          Všetky tituly autora
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
        {books.map((book, index) => (
          <BookCard key={book.id} book={book} index={index} />
        ))}
      </ul>
    </section>
  );
}
