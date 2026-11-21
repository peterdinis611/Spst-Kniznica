import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleBooks, sampleCategories } from "@/.storybook/fixtures";
import { BrowseGenres } from "./BrowseGenres";

const meta = {
  title: "Landing/BrowseGenres",
  component: BrowseGenres,
  tags: ["autodocs"],
  args: {
    categories: sampleCategories,
    books: sampleBooks,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BrowseGenres>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const JednaKategoria: Story = {
  args: {
    categories: sampleCategories.slice(0, 1),
    books: sampleBooks,
  },
};