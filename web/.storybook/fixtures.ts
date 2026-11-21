import type { CarouselBook, CatalogAuthor, CatalogBook, CatalogCategory } from "@/lib/catalog";
import type { AuthUser } from "@/lib/auth/types";
import type { BooksCatalogFilters } from "@/lib/catalog/catalog-url";

export const guestUser: AuthUser | null = null;

export const readerUser: AuthUser = {
  id: "user-reader",
  name: "Petra Čitateľová",
  email: "petra@spst.sk",
  roles: ["Student"],
  isAuthenticated: true,
  isStaff: false,
  isAdmin: false,
};

export const staffUser: AuthUser = {
  id: "user-staff",
  name: "Ján Knižník",
  email: "jan@spst.sk",
  roles: ["Librarian"],
  isAuthenticated: true,
  isStaff: true,
  isAdmin: false,
};

export const adminUser: AuthUser = {
  id: "user-admin",
  name: "Admin SPST",
  email: "admin@spst.sk",
  roles: ["Admin"],
  isAuthenticated: true,
  isStaff: true,
  isAdmin: true,
};

export const emptyCatalogFilters: BooksCatalogFilters = {};

export const sampleCatalogFilters: BooksCatalogFilters = {
  q: "orwell",
  categories: ["cat-scifi"],
  authors: ["author-orwell"],
  available: true,
  language: "sk",
};

export const sampleCarouselBooks: CarouselBook[] = [
  {
    id: "c1",
    title: "1984",
    author: "George Orwell",
    accent: "#4d7356",
    secondary: "#d8e8d4",
    motif: "forest",
  },
  {
    id: "c2",
    title: "Malý princ",
    author: "Antoine de Saint-Exupéry",
    accent: "#c97d4a",
    secondary: "#efe8dc",
    motif: "yellow",
  },
  {
    id: "c3",
    title: "Process",
    author: "Franz Kafka",
    accent: "#152433",
    secondary: "#d9d0c2",
    motif: "silhouette",
  },
  {
    id: "c4",
    title: "Psychológia peňazí",
    author: "Morgan Housel",
    accent: "#8FA888",
    secondary: "#E8F0E6",
    motif: "abstract",
  },
  {
    id: "c5",
    title: "Ako funguje inovácia",
    author: "Matt Ridley",
    accent: "#1F4E8C",
    secondary: "#D8E8F0",
    motif: "glass",
  },
];

export const sampleBook: CatalogBook = {
  id: "book-1984",
  title: "1984",
  subtitle: "Román",
  author: "George Orwell",
  authorId: "author-orwell",
  categoryName: "Sci-fi",
  categoryId: "cat-scifi",
  publisher: "Secker & Warburg",
  year: 1949,
  isbn: "9780451524935",
  language: "sk",
  pageCount: 328,
  formatLabel: "mäkká väzba",
  shelfLocation: "SF-ORW",
  accent: "#4d7356",
  secondary: "#d8e8d4",
  motif: "forest",
  availableCopies: 3,
  totalCopies: 5,
  description:
    "Dystopický román o totalitnej kontrole a jazyku ako nástroji moci.",
};

export const sampleBooks: CatalogBook[] = [
  sampleBook,
  {
    ...sampleBook,
    id: "book-prince",
    title: "Malý princ",
    author: "Antoine de Saint-Exupéry",
    categoryName: "Beletria",
    accent: "#c97d4a",
    secondary: "#efe8dc",
    motif: "yellow",
    availableCopies: 1,
    totalCopies: 4,
  },
  {
    ...sampleBook,
    id: "book-process",
    title: "Process",
    author: "Franz Kafka",
    categoryName: "Klasika",
    accent: "#152433",
    secondary: "#d9d0c2",
    motif: "silhouette",
    availableCopies: 0,
    totalCopies: 2,
  },
];

export const sampleCategories: CatalogCategory[] = [
  {
    id: "cat-scifi",
    name: "Sci-fi",
    description: "Budúcnosť, technika a spoločnosť.",
    accent: "#4d7356",
    secondary: "#d8e8d4",
    motif: "forest",
    isActive: true,
    bookCount: 42,
  },
  {
    id: "cat-fiction",
    name: "Beletria",
    description: "Próza a príbehy.",
    accent: "#c97d4a",
    secondary: "#efe8dc",
    motif: "yellow",
    isActive: true,
    bookCount: 128,
  },
  {
    id: "cat-classic",
    name: "Klasika",
    description: "Overené diela.",
    accent: "#152433",
    secondary: "#d9d0c2",
    motif: "silhouette",
    isActive: true,
    bookCount: 67,
  },
];

export const sampleAuthors: CatalogAuthor[] = [
  {
    id: "author-orwell",
    name: "George Orwell",
    bio: "Anglický spisovateľ a esejista.",
    nationality: "GB",
    birthYear: 1903,
    profileUrl: "https://en.wikipedia.org/wiki/George_Orwell",
    wikidataId: "Q3335",
    viafId: "95151646",
    isActive: true,
    accent: "#4d7356",
    bookCount: 8,
  },
  {
    id: "author-kafka",
    name: "Franz Kafka",
    bio: "Pražský nemecky píšuci autor.",
    nationality: "CZ",
    birthYear: 1883,
    isActive: true,
    accent: "#152433",
    bookCount: 5,
  },
];
