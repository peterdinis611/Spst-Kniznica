import { BookCarouselClient } from "@/components/landing/BookCarouselClient";
import { HowToUse } from "@/components/landing/HowToUse";
import { PopularShelf } from "@/components/landing/PopularShelf";
import { ReadingIntro } from "@/components/landing/ReadingIntro";
import { fetchCarouselBooks } from "@/lib/books";

export async function LandingContent() {
  const books = await fetchCarouselBooks();

  return (
    <>
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-10 md:px-8">
        <div className="reveal reveal-delay-3">
          <BookCarouselClient books={books} />
        </div>
      </section>
      <ReadingIntro />
      <PopularShelf books={books} />
      <HowToUse />
    </>
  );
}
