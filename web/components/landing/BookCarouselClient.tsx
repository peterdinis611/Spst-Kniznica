"use client";

import dynamic from "next/dynamic";
import type { CarouselBook } from "@/lib/catalog";

const BookCarousel = dynamic(
  () => import("./BookCarousel").then((mod) => mod.BookCarousel),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[360px] items-center justify-center sm:h-[420px] md:h-[460px]"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Načítavam karusel kníh"
      >
        <span className="sr-only">Načítavam karusel kníh…</span>
        <div
          className="h-10 w-10 animate-pulse rounded-full border border-accent/40"
          aria-hidden
        />
      </div>
    ),
  },
);

export function BookCarouselClient({ books }: { books: CarouselBook[] }) {
  return <BookCarousel books={books} />;
}
