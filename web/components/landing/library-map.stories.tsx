import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryMap } from "./LibraryMap";

const meta = {
  title: "Landing/LibraryMap",
  component: LibraryMap,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Načíta `/api/geocode`. V Storybook bez BFF uvidíš chybový stav — užitočné na kontrolu fallback UI.",
      },
    },
  },
} satisfies Meta<typeof LibraryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomQuery: Story = {
  args: {
    query: "SPŠT Piešťany",
  },
};
