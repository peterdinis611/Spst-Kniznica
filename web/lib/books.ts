import { apiGet } from "./api";
import type { BookDetail, BookListItem, CarouselBook, PagedResult } from "./types";

const COVER_PALETTES = [
  { accent: "#7BA08A", secondary: "#F3F7F2", motif: "crow" as const },
  { accent: "#1F4E8C", secondary: "#F6E27A", motif: "yellow" as const },
  { accent: "#0E1A24", secondary: "#E8EEF2", motif: "forest" as const },
  { accent: "#1C6B7A", secondary: "#F2D66B", motif: "glass" as const },
  { accent: "#3A1D22", secondary: "#E8D8CF", motif: "silhouette" as const },
  { accent: "#7A4E2D", secondary: "#F5EADF", motif: "abstract" as const },
  { accent: "#1F3A34", secondary: "#E2EEE9", motif: "abstract" as const },
] as const;

export const DEMO_BOOKS: CarouselBook[] = [
  {
    id: "demo-fosters-oddities",
    title: "Foster's Oddities",
    author: "Allen P.",
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
    isDemo: true,
  },
  {
    id: "demo-sorrow-bliss",
    title: "Sorrow and Bliss",
    author: "Meg Mason",
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
    isDemo: true,
  },
  {
    id: "demo-available-dark",
    title: "Available Dark",
    author: "Elizabeth Hand",
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
    isDemo: true,
  },
  {
    id: "demo-pretty-people",
    title: "All the Pretty People",
    author: "Barbara Freethy",
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
    isDemo: true,
  },
  {
    id: "demo-degrees",
    title: "Degrees",
    author: "Mukerji",
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
    isDemo: true,
  },
];

function paletteFor(index: number) {
  return COVER_PALETTES[index % COVER_PALETTES.length];
}

export function toCarouselBooks(items: BookListItem[]): CarouselBook[] {
  return items.slice(0, 7).map((book, index) => {
    const palette = paletteFor(index);
    return {
      id: book.id,
      title: book.title,
      author: book.author || "Neznámy autor",
      accent: palette.accent,
      secondary: palette.secondary,
      motif: palette.motif,
    };
  });
}

export async function fetchCarouselBooks(): Promise<CarouselBook[]> {
  try {
    const result = await apiGet<PagedResult<BookListItem>>("/api/books?page=1&pageSize=7");
    const items = result.items ?? [];
    if (items.length === 0) {
      return DEMO_BOOKS;
    }
    return toCarouselBooks(items);
  } catch {
    return DEMO_BOOKS;
  }
}

export async function fetchBookDetail(id: string): Promise<BookDetail | null> {
  const demo = DEMO_BOOKS.find((book) => book.id === id);
  if (demo) {
    return {
      id: demo.id,
      title: demo.title,
      author: demo.author,
      description:
        "Ukážková kniha z landing karuselu. Po napojení na BookService sa tu zobrazia skutočné detaily z katalógu.",
      categoryName: "Ukážka",
      publishedYear: 2021,
      totalCopies: 1,
      availableCopies: 1,
      language: "en",
    };
  }

  try {
    return await apiGet<BookDetail>(`/api/books/${id}`);
  } catch {
    return null;
  }
}
