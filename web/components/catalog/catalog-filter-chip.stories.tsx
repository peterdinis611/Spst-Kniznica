import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogFilterChip } from "./CatalogFilterChip";

const meta = {
  title: "Catalog/CatalogFilterChip",
  component: CatalogFilterChip,
  tags: ["autodocs"],
  args: {
    href: "/books?category=cat-scifi",
    active: false,
    children: "Sci-fi",
  },
} satisfies Meta<typeof CatalogFilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neaktivny: Story = {};

export const Aktivny: Story = {
  args: {
    active: true,
    children: "Sci-fi",
  },
};