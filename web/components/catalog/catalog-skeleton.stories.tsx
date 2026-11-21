import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogSkeleton } from "./CatalogSkeleton";

const meta = {
  title: "Catalog/CatalogSkeleton",
  component: CatalogSkeleton,
  tags: ["autodocs"],
  args: {
    rows: 4,
    variant: "default",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof CatalogSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Books: Story = {
  args: { variant: "books" },
};

export const BooksGrid: Story = {
  args: { variant: "books-grid", rows: 6 },
};

export const Desk: Story = {
  args: { variant: "desk" },
};

export const Panel: Story = {
  args: { variant: "panel" },
};

export const Library: Story = {
  args: { variant: "library" },
};