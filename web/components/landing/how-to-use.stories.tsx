import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HowToUse } from "./HowToUse";

const meta = {
  title: "Landing/HowToUse",
  component: HowToUse,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HowToUse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};