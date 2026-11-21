import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCarouselBooks } from "@/.storybook/fixtures";
import { PopularShelf } from "./PopularShelf";

const meta = {
  title: "Landing/PopularShelf",
  component: PopularShelf,
  tags: ["autodocs"],
  args: {
    books: sampleCarouselBooks,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PopularShelf>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};