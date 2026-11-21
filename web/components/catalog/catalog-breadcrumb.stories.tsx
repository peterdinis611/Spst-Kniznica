import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogBreadcrumb } from "./CatalogBreadcrumb";

const meta = {
  title: "Catalog/CatalogBreadcrumb",
  component: CatalogBreadcrumb,
  tags: ["autodocs"],
  args: {
    items: [{ label: "Knihy", href: "/books" }, { label: "1984" }],
  },
} satisfies Meta<typeof CatalogBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DetailKnihy: Story = {};

export const HlbokaNavigacia: Story = {
  args: {
    items: [
      { label: "Knihy", href: "/books" },
      { label: "Sci-fi", href: "/categories/cat-scifi" },
      { label: "George Orwell", href: "/authors/author-orwell" },
      { label: "1984" },
    ],
  },
};