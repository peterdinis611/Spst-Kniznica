import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCarouselBooks } from "@/.storybook/fixtures";
import { TrendingBooks } from "./TrendingBooks";

const meta = {
  title: "Landing/TrendingBooks",
  component: TrendingBooks,
  tags: ["autodocs"],
  args: {
    books: sampleCarouselBooks,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TrendingBooks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KratkyZoznam: Story = {
  args: {
    books: sampleCarouselBooks.slice(0, 3),
  },
};