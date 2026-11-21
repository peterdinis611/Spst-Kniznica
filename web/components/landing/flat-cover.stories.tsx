import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlatCover } from "./FlatCover";

const meta = {
  title: "Landing/FlatCover",
  component: FlatCover,
  tags: ["autodocs"],
  args: {
    title: "1984",
    author: "George Orwell",
    accent: "#4d7356",
    secondary: "#d8e8d4",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[11rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FlatCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SAutorom: Story = {};

export const BezAutora: Story = {
  args: {
    author: undefined,
    title: "Malý princ",
    accent: "#c97d4a",
    secondary: "#efe8dc",
  },
};

export const DlhyNazov: Story = {
  args: {
    title: "Psychológia peňazí a dlhodobé správanie investorov",
    author: "Morgan Housel",
    accent: "#8FA888",
    secondary: "#E8F0E6",
  },
};