import Link from "next/link";
import { FlatCover } from "@/components/landing/FlatCover";
import { TrendingBooksControls } from "@/components/landing/TrendingBooksControls";
import type { CarouselBook } from "@/lib/catalog";

type TrendingBooksProps = {
  books: CarouselBook[];
};

export function TrendingBooks({ books }: TrendingBooksProps) {
  const items = books.slice(0, 8);

  return (
    <section className="relative z-10 border-t border-rule bg-paper px-4 py-14 sm:px-6 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <TrendingBooksControls>
          <h2 className="flex-1 text-center font-display text-[clamp(1.8rem,4vw,2.75rem)] tracking-tight text-ink uppercase">
            Top trending books
          </h2>
        </TrendingBooksControls>

        <ul
          data-trending-scroller
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((book, index) => {
            const featured = index === 1;
            return (
              <li
                key={book.id}
                className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[23%]"
              >
                <Link
                  href={`/books/${book.id}`}
                  prefetch={false}
                  className={`group flex h-full flex-col border border-transparent p-4 transition ${
                    featured
                      ? "bg-[#e53935] text-white"
                      : "bg-paper-deep hover:border-ink"
                  }`}
                >
                  <p
                    className={`font-display text-lg leading-tight ${
                      featured ? "text-white" : "text-ink"
                    }`}
                  >
                    {book.title}
                  </p>
                  <p
                    className={`mt-1 text-xs tracking-[0.08em] uppercase ${
                      featured ? "text-white/75" : "text-muted-foreground"
                    }`}
                  >
                    {book.author}
                  </p>
                  <div className="mt-5 w-[70%] self-center transition duration-300 group-hover:-translate-y-1">
                    <FlatCover
                      title={book.title}
                      accent={book.accent}
                      secondary={book.secondary}
                      className="shadow-none"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <TrendingBooksControls placement="mobile" />
      </div>
    </section>
  );
}
