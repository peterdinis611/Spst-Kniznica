import type { CoverMotif } from "./types";

export type MockCategory = {
  id: string;
  name: string;
  description: string;
  bookCount: number;
  accent: string;
  secondary: string;
  motif: CoverMotif;
};

export type MockAuthor = {
  id: string;
  name: string;
  bio: string;
  bookCount: number;
  nationality: string;
  accent: string;
};

export type MockBook = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  categoryId: string;
  categoryName: string;
  year: number;
  accent: string;
  secondary: string;
  motif: CoverMotif;
  availableCopies: number;
  totalCopies: number;
  recommended?: boolean;
};

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: "cat-investing",
    name: "Ekonomika",
    description: "Peniaze, investície a finančná gramotnosť",
    bookCount: 18,
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
  },
  {
    id: "cat-design",
    name: "Dizajn",
    description: "Typografia, UX a vizuálna kultúra",
    bookCount: 12,
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
  },
  {
    id: "cat-business",
    name: "Podnikanie",
    description: "Inovácie, stratégie a riadenie",
    bookCount: 21,
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
  },
  {
    id: "cat-self",
    name: "Sebarozvoj",
    description: "Zvyky, produktivita a myslenie",
    bookCount: 15,
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
  },
  {
    id: "cat-fiction",
    name: "Beletria",
    description: "Romány a poviedky pre voľný čas",
    bookCount: 34,
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
  },
  {
    id: "cat-tech",
    name: "Technológie",
    description: "Softvér, siete a priemysel 4.0",
    bookCount: 27,
    accent: "#7A4E2D",
    secondary: "#F5EADF",
    motif: "abstract",
  },
];

export const MOCK_AUTHORS: MockAuthor[] = [
  {
    id: "auth-mason",
    name: "Meg Mason",
    bio: "Autorka súčasnej prózy s dôrazom na psychológiu postáv.",
    bookCount: 3,
    nationality: "NZ",
    accent: "#1F4E8C",
  },
  {
    id: "auth-hand",
    name: "Elizabeth Hand",
    bio: "Spisovateľka temnej fikcie a napätých príbehov.",
    bookCount: 5,
    nationality: "US",
    accent: "#0E1A24",
  },
  {
    id: "auth-freethy",
    name: "Barbara Freethy",
    bio: "Populárna autorka romantických a rodinných ság.",
    bookCount: 8,
    nationality: "US",
    accent: "#1C6B7A",
  },
  {
    id: "auth-mukerji",
    name: "Mukerji",
    bio: "Autorka literárnych príbehov o identite a meste.",
    bookCount: 2,
    nationality: "IN",
    accent: "#3A1D22",
  },
  {
    id: "auth-allen",
    name: "Allen P.",
    bio: "Kurátor zvláštnych zbierok a krátkych próz.",
    bookCount: 4,
    nationality: "UK",
    accent: "#7BA08A",
  },
  {
    id: "auth-housel",
    name: "Morgan Housel",
    bio: "Esejista o správaní, bohatstve a dlhodobom myslení.",
    bookCount: 2,
    nationality: "US",
    accent: "#1F4E8C",
  },
];

export const MOCK_BOOKS: MockBook[] = [
  {
    id: "demo-psych-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    authorId: "auth-housel",
    categoryId: "cat-investing",
    categoryName: "Ekonomika",
    year: 2020,
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
    availableCopies: 2,
    totalCopies: 4,
    recommended: true,
  },
  {
    id: "demo-company-one",
    title: "Company of One",
    author: "Paul Jarvis",
    authorId: "auth-allen",
    categoryId: "cat-business",
    categoryName: "Podnikanie",
    year: 2019,
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
    availableCopies: 1,
    totalCopies: 2,
    recommended: true,
  },
  {
    id: "demo-innovation",
    title: "How Innovation Works",
    author: "Matt Ridley",
    authorId: "auth-allen",
    categoryId: "cat-tech",
    categoryName: "Technológie",
    year: 2020,
    accent: "#7A4E2D",
    secondary: "#F5EADF",
    motif: "abstract",
    availableCopies: 3,
    totalCopies: 3,
    recommended: true,
  },
  {
    id: "demo-dorian",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    authorId: "auth-hand",
    categoryId: "cat-fiction",
    categoryName: "Beletria",
    year: 1890,
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
    availableCopies: 0,
    totalCopies: 2,
    recommended: true,
  },
  {
    id: "demo-sorrow-bliss",
    title: "Sorrow and Bliss",
    author: "Meg Mason",
    authorId: "auth-mason",
    categoryId: "cat-fiction",
    categoryName: "Beletria",
    year: 2020,
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
    availableCopies: 1,
    totalCopies: 2,
  },
  {
    id: "demo-available-dark",
    title: "Available Dark",
    author: "Elizabeth Hand",
    authorId: "auth-hand",
    categoryId: "cat-fiction",
    categoryName: "Beletria",
    year: 2012,
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
    availableCopies: 2,
    totalCopies: 2,
  },
  {
    id: "demo-pretty-people",
    title: "All the Pretty People",
    author: "Barbara Freethy",
    authorId: "auth-freethy",
    categoryId: "cat-fiction",
    categoryName: "Beletria",
    year: 2018,
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
    availableCopies: 1,
    totalCopies: 3,
  },
  {
    id: "demo-degrees",
    title: "Degrees",
    author: "Mukerji",
    authorId: "auth-mukerji",
    categoryId: "cat-self",
    categoryName: "Sebarozvoj",
    year: 2021,
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
    availableCopies: 2,
    totalCopies: 2,
  },
];

export function getRecommendedBooks() {
  return MOCK_BOOKS.filter((book) => book.recommended);
}

export function getAuthorBooks(authorId: string) {
  return MOCK_BOOKS.filter((book) => book.authorId === authorId);
}

export function getCategoryBooks(categoryId: string) {
  return MOCK_BOOKS.filter((book) => book.categoryId === categoryId);
}

export function getAuthorInitials() {
  return [
    ...new Set(
      MOCK_AUTHORS.map((author) => author.name.charAt(0).toUpperCase()),
    ),
  ].sort((a, b) => a.localeCompare(b, "sk"));
}

