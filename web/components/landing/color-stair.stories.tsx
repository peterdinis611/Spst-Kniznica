import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ColorStair } from "./ColorStair";

const meta = {
  title: "Landing/ColorStair",
  component: ColorStair,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ColorStair>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};