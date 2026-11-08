import type { CoverMotif } from "./types";

/** Stable IDs aligned with SpstKniznica.Common.Seed.LibrarySeedIds */
export const SEED_IDS = {
  categories: {
    ekonomika: "a1111111-1111-4111-8111-111111111001",
    dizajn: "a1111111-1111-4111-8111-111111111002",
    podnikanie: "a1111111-1111-4111-8111-111111111003",
    sebarozvoj: "a1111111-1111-4111-8111-111111111004",
    beletria: "a1111111-1111-4111-8111-111111111005",
    technologie: "a1111111-1111-4111-8111-111111111006",
  },
  authors: {
    mason: "b2222222-2222-4222-8222-222222222001",
    hand: "b2222222-2222-4222-8222-222222222002",
    freethy: "b2222222-2222-4222-8222-222222222003",
    mukerji: "b2222222-2222-4222-8222-222222222004",
    allen: "b2222222-2222-4222-8222-222222222005",
    housel: "b2222222-2222-4222-8222-222222222006",
    jarvis: "b2222222-2222-4222-8222-222222222007",
    ridley: "b2222222-2222-4222-8222-222222222008",
    wilde: "b2222222-2222-4222-8222-222222222009",
    clear: "b2222222-2222-4222-8222-222222222010",
    krug: "b2222222-2222-4222-8222-222222222011",
    ries: "b2222222-2222-4222-8222-222222222012",
  },
  books: {
    psychMoney: "c3333333-3333-4333-8333-333333333001",
    companyOne: "c3333333-3333-4333-8333-333333333002",
    innovation: "c3333333-3333-4333-8333-333333333003",
    dorian: "c3333333-3333-4333-8333-333333333004",
    sorrowBliss: "c3333333-3333-4333-8333-333333333005",
    availableDark: "c3333333-3333-4333-8333-333333333006",
    prettyPeople: "c3333333-3333-4333-8333-333333333007",
    degrees: "c3333333-3333-4333-8333-333333333008",
    fostersOddities: "c3333333-3333-4333-8333-333333333009",
    atomicHabits: "c3333333-3333-4333-8333-333333333010",
    dontMakeMeThink: "c3333333-3333-4333-8333-333333333011",
    leanStartup: "c3333333-3333-4333-8333-333333333012",
  },
} as const;

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
    id: SEED_IDS.categories.ekonomika,
    name: "Ekonomika",
    description: "Peniaze, investície a finančná gramotnosť",
    bookCount: 18,
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
  },
  {
    id: SEED_IDS.categories.dizajn,
    name: "Dizajn",
    description: "Typografia, UX a vizuálna kultúra",
    bookCount: 12,
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
  },
  {
    id: SEED_IDS.categories.podnikanie,
    name: "Podnikanie",
    description: "Inovácie, stratégie a riadenie",
    bookCount: 21,
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
  },
  {
    id: SEED_IDS.categories.sebarozvoj,
    name: "Sebarozvoj",
    description: "Zvyky, produktivita a myslenie",
    bookCount: 15,
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
  },
  {
    id: SEED_IDS.categories.beletria,
    name: "Beletria",
    description: "Romány a poviedky pre voľný čas",
    bookCount: 34,
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
  },
  {
    id: SEED_IDS.categories.technologie,
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
    id: SEED_IDS.authors.mason,
    name: "Meg Mason",
    bio: "Autorka súčasnej prózy s dôrazom na psychológiu postáv.",
    bookCount: 3,
    nationality: "NZ",
    accent: "#1F4E8C",
  },
  {
    id: SEED_IDS.authors.hand,
    name: "Elizabeth Hand",
    bio: "Spisovateľka temnej fikcie a napätých príbehov.",
    bookCount: 5,
    nationality: "US",
    accent: "#0E1A24",
  },
  {
    id: SEED_IDS.authors.freethy,
    name: "Barbara Freethy",
    bio: "Populárna autorka romantických a rodinných ság.",
    bookCount: 8,
    nationality: "US",
    accent: "#1C6B7A",
  },
  {
    id: SEED_IDS.authors.mukerji,
    name: "Mukerji",
    bio: "Autorka literárnych príbehov o identite a meste.",
    bookCount: 2,
    nationality: "IN",
    accent: "#3A1D22",
  },
  {
    id: SEED_IDS.authors.allen,
    name: "Allen P.",
    bio: "Kurátor zvláštnych zbierok a krátkych próz.",
    bookCount: 4,
    nationality: "UK",
    accent: "#7BA08A",
  },
  {
    id: SEED_IDS.authors.housel,
    name: "Morgan Housel",
    bio: "Esejista o správaní, bohatstve a dlhodobom myslení.",
    bookCount: 2,
    nationality: "US",
    accent: "#1F4E8C",
  },
  {
    id: SEED_IDS.authors.jarvis,
    name: "Paul Jarvis",
    bio: "Autor o malých firmách, produktivite a nezávislosti.",
    bookCount: 2,
    nationality: "CA",
    accent: "#1C6B7A",
  },
  {
    id: SEED_IDS.authors.ridley,
    name: "Matt Ridley",
    bio: "Vedecký popularizátor a autor kníh o inováciách.",
    bookCount: 1,
    nationality: "UK",
    accent: "#7A4E2D",
  },
  {
    id: SEED_IDS.authors.wilde,
    name: "Oscar Wilde",
    bio: "Írsky dramaturg a romanopisec, autor Dorian Gray.",
    bookCount: 1,
    nationality: "IE",
    accent: "#0E1A24",
  },
  {
    id: SEED_IDS.authors.clear,
    name: "James Clear",
    bio: "Autor o zvykoch, produktivite a kontinuálnom zlepšovaní.",
    bookCount: 1,
    nationality: "US",
    accent: "#3A1D22",
  },
  {
    id: SEED_IDS.authors.krug,
    name: "Steve Krug",
    bio: "UX konzultant a autor kníh o použiteľnosti webu.",
    bookCount: 1,
    nationality: "US",
    accent: "#7BA08A",
  },
  {
    id: SEED_IDS.authors.ries,
    name: "Eric Ries",
    bio: "Podnikateľ a autor metodiky Lean Startup.",
    bookCount: 1,
    nationality: "US",
    accent: "#1C6B7A",
  },
];

export const MOCK_BOOKS: MockBook[] = [
  {
    id: SEED_IDS.books.psychMoney,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    authorId: SEED_IDS.authors.housel,
    categoryId: SEED_IDS.categories.ekonomika,
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
    id: SEED_IDS.books.companyOne,
    title: "Company of One",
    author: "Paul Jarvis",
    authorId: SEED_IDS.authors.jarvis,
    categoryId: SEED_IDS.categories.podnikanie,
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
    id: SEED_IDS.books.innovation,
    title: "How Innovation Works",
    author: "Matt Ridley",
    authorId: SEED_IDS.authors.ridley,
    categoryId: SEED_IDS.categories.technologie,
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
    id: SEED_IDS.books.dorian,
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    authorId: SEED_IDS.authors.wilde,
    categoryId: SEED_IDS.categories.beletria,
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
    id: SEED_IDS.books.sorrowBliss,
    title: "Sorrow and Bliss",
    author: "Meg Mason",
    authorId: SEED_IDS.authors.mason,
    categoryId: SEED_IDS.categories.beletria,
    categoryName: "Beletria",
    year: 2020,
    accent: "#1F4E8C",
    secondary: "#F6E27A",
    motif: "yellow",
    availableCopies: 1,
    totalCopies: 2,
  },
  {
    id: SEED_IDS.books.availableDark,
    title: "Available Dark",
    author: "Elizabeth Hand",
    authorId: SEED_IDS.authors.hand,
    categoryId: SEED_IDS.categories.beletria,
    categoryName: "Beletria",
    year: 2012,
    accent: "#0E1A24",
    secondary: "#E8EEF2",
    motif: "forest",
    availableCopies: 2,
    totalCopies: 2,
  },
  {
    id: SEED_IDS.books.prettyPeople,
    title: "All the Pretty People",
    author: "Barbara Freethy",
    authorId: SEED_IDS.authors.freethy,
    categoryId: SEED_IDS.categories.beletria,
    categoryName: "Beletria",
    year: 2018,
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
    availableCopies: 1,
    totalCopies: 3,
  },
  {
    id: SEED_IDS.books.degrees,
    title: "Degrees",
    author: "Mukerji",
    authorId: SEED_IDS.authors.mukerji,
    categoryId: SEED_IDS.categories.sebarozvoj,
    categoryName: "Sebarozvoj",
    year: 2021,
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
    availableCopies: 2,
    totalCopies: 2,
  },
  {
    id: SEED_IDS.books.fostersOddities,
    title: "Foster's Oddities",
    author: "Allen P.",
    authorId: SEED_IDS.authors.allen,
    categoryId: SEED_IDS.categories.beletria,
    categoryName: "Beletria",
    year: 2017,
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
    availableCopies: 1,
    totalCopies: 1,
    recommended: true,
  },
  {
    id: SEED_IDS.books.atomicHabits,
    title: "Atomic Habits",
    author: "James Clear",
    authorId: SEED_IDS.authors.clear,
    categoryId: SEED_IDS.categories.sebarozvoj,
    categoryName: "Sebarozvoj",
    year: 2018,
    accent: "#3A1D22",
    secondary: "#E8D8CF",
    motif: "silhouette",
    availableCopies: 2,
    totalCopies: 3,
  },
  {
    id: SEED_IDS.books.dontMakeMeThink,
    title: "Don't Make Me Think",
    author: "Steve Krug",
    authorId: SEED_IDS.authors.krug,
    categoryId: SEED_IDS.categories.dizajn,
    categoryName: "Dizajn",
    year: 2014,
    accent: "#7BA08A",
    secondary: "#F3F7F2",
    motif: "crow",
    availableCopies: 2,
    totalCopies: 2,
  },
  {
    id: SEED_IDS.books.leanStartup,
    title: "The Lean Startup",
    author: "Eric Ries",
    authorId: SEED_IDS.authors.ries,
    categoryId: SEED_IDS.categories.podnikanie,
    categoryName: "Podnikanie",
    year: 2011,
    accent: "#1C6B7A",
    secondary: "#F2D66B",
    motif: "glass",
    availableCopies: 1,
    totalCopies: 3,
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
