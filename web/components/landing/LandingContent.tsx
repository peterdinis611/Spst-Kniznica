import { BrowseGenres } from "@/components/landing/BrowseGenres";
import { ColorStair } from "@/components/landing/ColorStair";
import { HeroSection } from "@/components/landing/HeroSection";
import { MeetupBanner } from "@/components/landing/MeetupBanner";
import { TrendingBooks } from "@/components/landing/TrendingBooks";
import { searchBooksAction } from "@/lib/actions/books";
import { searchCategoriesAction } from "@/lib/actions/categories";
import { toCarouselBooks } from "@/lib/books";

export async function LandingContent() {
  const [booksResult, categoriesResult] = await Promise.all([
    searchBooksAction({ page: 1, pageSize: 12 }),
    searchCategoriesAction({ page: 1, pageSize: 20 }),
  ]);

  const catalogBooks = booksResult?.data?.items ?? [];
  const categories = categoriesResult?.data?.items ?? [];
  const carouselBooks = toCarouselBooks(catalogBooks);

  return (
    <>
      <HeroSection books={carouselBooks} />
      <ColorStair />
      <TrendingBooks books={carouselBooks} />
      <BrowseGenres categories={categories} books={catalogBooks} />
      <MeetupBanner />
    </>
  );
}
