import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaqSection } from "./FaqSection";

const meta = {
  title: "Landing/FaqSection",
  component: FaqSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FaqSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};