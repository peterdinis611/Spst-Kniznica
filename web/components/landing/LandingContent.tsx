import { BrowseGenres } from "@/components/landing/BrowseGenres";
import { ColorStair } from "@/components/landing/ColorStair";
import { HeroSection } from "@/components/landing/HeroSection";
import { MeetupBanner } from "@/components/landing/MeetupBanner";
import { TrendingBooks } from "@/components/landing/TrendingBooks";
import { fetchCarouselBooks } from "@/lib/books";

export async function LandingContent() {
  const books = await fetchCarouselBooks();

  return (
    <>
      <HeroSection books={books} />
      <ColorStair />
      <TrendingBooks books={books} />
      <BrowseGenres />
      <MeetupBanner />
    </>
  );
}
