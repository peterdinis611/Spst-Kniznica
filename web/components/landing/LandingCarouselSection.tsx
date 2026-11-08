import { BookCarouselClient } from "@/components/landing/BookCarouselClient";
import { fetchCarouselBooks } from "@/lib/books";

export async function LandingCarouselSection() {
  const books = await fetchCarouselBooks();
  return <BookCarouselClient books={books} />;
}
