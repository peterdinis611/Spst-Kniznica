import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogShell } from "./CatalogShell";

const meta = {
  title: "Catalog/CatalogShell",
  component: CatalogShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CatalogShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl text-ink">Katalóg kníh</h1>
        <p className="mt-3 text-muted-foreground">
          Ukážkový obsah vnútri škrupiny katalógu so spoločnou hlavičkou.
        </p>
      </div>
    ),
  },
};