import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookCover } from "./BookCover";

const meta = {
  title: "Catalog/BookCover",
  component: BookCover,
  tags: ["autodocs"],
  args: {
    title: "1984",
    author: "George Orwell",
    accent: "#4d7356",
    secondary: "#d8e8d4",
    className: "aspect-[2/3] w-full max-w-[12rem]",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[12rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BookCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BezAutora: Story = {
  args: {
    author: undefined,
    title: "Process",
    accent: "#152433",
    secondary: "#d9d0c2",
  },
};