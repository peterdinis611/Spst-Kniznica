import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { BookCard } from "@/components/catalog/BookCard";
import { buildBooksCatalogHref } from "@/lib/catalog/catalog-url";
import { searchBooksAction } from "@/lib/catalog/actions";

type CategoryMoreBooksProps = {
  categoryId?: string | null;
  categoryName: string;
  excludeBookId: string;
};

export async function CategoryMoreBooks({
  categoryId,
  categoryName,
  excludeBookId,
}: CategoryMoreBooksProps) {
  if (!categoryId) return null;

  const result = await searchBooksAction({
    categoryId,
    page: 1,
    pageSize: 12,
  });

  const books = (result?.data?.items ?? [])
    .filter((book) => book.id !== excludeBookId)
    .slice(0, 4);

  if (books.length === 0) return null;

  const catalogHref = buildBooksCatalogHref({
    categories: categoryId ? [categoryId] : undefined,
  });

  return (
    <section
      className="mt-10 border-t border-rule pt-10 sm:pt-12 dark:border-white/10"
      aria-labelledby="category-more-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Rovnaká rada
          </p>
          <h2
            id="category-more-heading"
            className="mt-2 font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-tight tracking-tight text-ink"
          >
            Viac z {categoryName}
          </h2>
        </div>

        <Link
          href={catalogHref}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-sage transition hover:text-ink"
        >
          Celá kategória
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
        {books.map((book, index) => (
          <li key={book.id}>
            <BookCard book={book} index={index} />
          </li>
        ))}
      </ul>
    </section>
  );
}
