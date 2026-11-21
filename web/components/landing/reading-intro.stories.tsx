import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReadingIntro } from "./ReadingIntro";

const meta = {
  title: "Landing/ReadingIntro",
  component: ReadingIntro,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ReadingIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};