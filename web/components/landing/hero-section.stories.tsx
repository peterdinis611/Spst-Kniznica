import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCarouselBooks } from "@/.storybook/fixtures";
import { HeroSection } from "./HeroSection";

const meta = {
  title: "Landing/HeroSection",
  component: HeroSection,
  tags: ["autodocs"],
  args: {
    books: sampleCarouselBooks,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MenejKnih: Story = {
  args: {
    books: sampleCarouselBooks.slice(0, 1),
  },
};