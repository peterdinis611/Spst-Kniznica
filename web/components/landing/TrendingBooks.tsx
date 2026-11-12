"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { Button } from "@/components/ui/button";
import type { CarouselBook } from "@/lib/catalog";

type TrendingBooksProps = {
  books: CarouselBook[];
};

export function TrendingBooks({ books }: TrendingBooksProps) {
  const scroller = useRef<HTMLUListElement>(null);
  const items = books.slice(0, 8);

  const scrollBy = (dir: -1 | 1) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: dir * Math.min(320, node.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <section className="relative z-10 border-t border-rule bg-paper px-4 py-14 sm:px-6 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-10 rounded-none border-ink sm:inline-flex"
            onClick={() => scrollBy(-1)}
            aria-label="Predchádzajúce"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <h2 className="flex-1 text-center font-display text-[clamp(1.8rem,4vw,2.75rem)] tracking-tight text-ink uppercase">
            Top trending books
          </h2>

          <Button
            variant="outline"
            size="icon"
            className="hidden size-10 rounded-none border-ink sm:inline-flex"
            onClick={() => scrollBy(1)}
            aria-label="Ďalšie"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <ul
          ref={scroller}
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

        <div className="mt-6 flex justify-center gap-2 sm:hidden">
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-none border-ink"
            onClick={() => scrollBy(-1)}
            aria-label="Predchádzajúce"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-none border-ink"
            onClick={() => scrollBy(1)}
            aria-label="Ďalšie"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
