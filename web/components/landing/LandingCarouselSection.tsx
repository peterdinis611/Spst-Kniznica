import { BookCarouselClient } from "@/components/landing/BookCarouselClient";
import { fetchCarouselBooks } from "@/lib/catalog";

export async function LandingCarouselSection() {
  const books = await fetchCarouselBooks();
  return <BookCarouselClient books={books} />;
}
