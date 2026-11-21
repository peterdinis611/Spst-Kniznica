import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleBook } from "@/.storybook/fixtures";
import { BookDetailCover } from "./BookDetailCover";

const meta = {
  title: "Catalog/BookDetailCover",
  component: BookDetailCover,
  tags: ["autodocs"],
  args: {
    title: sampleBook.title,
    author: sampleBook.author,
    accent: sampleBook.accent,
    secondary: sampleBook.secondary ?? "#d8e8d4",
    isbn: null,
    coverUrl: null,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[14rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BookDetailCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlaskaObalka: Story = {};

export const SIsbn: Story = {
  args: {
    isbn: sampleBook.isbn,
  },
};

export const VlastnaUrl: Story = {
  args: {
    coverUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/51/1984_first_edition_cover.jpg",
    isbn: null,
  },
};