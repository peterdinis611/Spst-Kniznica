import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Button } from "@/components/ui/button";
import { BooksCatalogFiltersDialog } from "./BooksCatalogFiltersDialog";

const meta = {
  title: "Catalog/BooksCatalogFiltersDialog",
  component: BooksCatalogFiltersDialog,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: { pathname: "/books" },
    },
  },
  args: {
    open: true,
    onOpenChange: fn(),
    applied: {
      shelf: "SF",
      year: 1949,
      language: "sk",
    },
    shelfZones: [
      { id: "A", label: "Prízemie A" },
      { id: "SF", label: "Sci-fi regál" },
    ],
    searchQuery: "orwell",
  },
} satisfies Meta<typeof BooksCatalogFiltersDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Interactive: Story = {
  render: function InteractiveFilters(args) {
    const [open, setOpen] = useState(true);
    return (
      <div className="space-y-4">
        <Button type="button" onClick={() => setOpen(true)}>
          Otvoriť filtre
        </Button>
        <BooksCatalogFiltersDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    );
  },
};
