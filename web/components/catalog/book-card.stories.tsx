import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CatalogBook } from "@/lib/catalog";
import { BookCard } from "./BookCard";

const sampleBook: CatalogBook = {
  id: "book-1984",
  title: "1984",
  author: "George Orwell",
  authorId: "author-orwell",
  categoryName: "Sci-fi",
  categoryId: "cat-scifi",
  year: 1949,
  accent: "#4d7356",
  secondary: "#d8e8d4",
  motif: "forest",
  availableCopies: 3,
  totalCopies: 5,
  description: "Dystopický román o totalitnej kontrole.",
};

const lowStock: CatalogBook = {
  ...sampleBook,
  id: "book-low",
  title: "Malý princ",
  author: "Antoine de Saint-Exupéry",
  categoryName: "Beletria",
  accent: "#c97d4a",
  secondary: "#efe8dc",
  motif: "yellow",
  availableCopies: 1,
  totalCopies: 4,
};

const unavailable: CatalogBook = {
  ...sampleBook,
  id: "book-out",
  title: "Process",
  author: "Franz Kafka",
  categoryName: "Klasika",
  accent: "#152433",
  secondary: "#d9d0c2",
  motif: "silhouette",
  availableCopies: 0,
  totalCopies: 2,
};

const meta = {
  title: "Catalog/BookCard",
  component: BookCard,
  tags: ["autodocs"],
  args: {
    book: sampleBook,
    index: 0,
  },
} satisfies Meta<typeof BookCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const singleCard: Decorator[] = [
  (Story) => (
    <div className="mx-auto max-w-[16rem]">
      <Story />
    </div>
  ),
];

export const Available: Story = {
  decorators: singleCard,
};

export const LowStock: Story = {
  args: { book: lowStock },
  decorators: singleCard,
};

export const Unavailable: Story = {
  args: { book: unavailable },
  decorators: singleCard,
};

export const Grid: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
      <BookCard book={sampleBook} index={0} />
      <BookCard book={lowStock} index={1} />
      <BookCard book={unavailable} index={2} />
    </div>
  ),
};
