import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleBook } from "@/.storybook/fixtures";
import { BookBiblioFacts } from "./BookBiblioFacts";

const bookWithInventory = {
  ...sampleBook,
  copySummary: {
    available: 3,
    borrowed: 1,
    reserved: 1,
    lost: 0,
    maintenance: 0,
  },
  copies: [
    {
      id: "copy-1",
      inventoryNumber: "SPST-1984-001",
      status: 0 as const,
      shelfLocation: "SF-ORW",
    },
    {
      id: "copy-2",
      inventoryNumber: "SPST-1984-002",
      status: 1 as const,
      shelfLocation: "SF-ORW",
    },
    {
      id: "copy-3",
      inventoryNumber: "SPST-1984-003",
      status: 2 as const,
      shelfLocation: "REZERVA",
    },
  ],
};

const meta = {
  title: "Catalog/BookBiblioFacts",
  component: BookBiblioFacts,
  tags: ["autodocs"],
  args: {
    book: sampleBook,
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof BookBiblioFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZakladneFakty: Story = {};

export const InventarAStav: Story = {
  args: {
    book: bookWithInventory,
  },
};