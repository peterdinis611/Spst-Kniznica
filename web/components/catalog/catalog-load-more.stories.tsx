import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CatalogLoadMore } from "./CatalogLoadMore";

const meta = {
  title: "Catalog/CatalogLoadMore",
  component: CatalogLoadMore,
  tags: ["autodocs"],
  args: {
    hasMore: true,
    loadingMore: false,
    loadedCount: 24,
    onLoadMore: fn(),
    itemLabel: "titulov",
    loadingLabel: "Načítavam ďalšie tituly…",
    ariaLabel: "Načítať ďalšie tituly",
  },
} satisfies Meta<typeof CatalogLoadMore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DalsieDostupne: Story = {};

export const Nacitava: Story = {
  args: {
    loadingMore: true,
  },
};

export const VsetkoNacitane: Story = {
  args: {
    hasMore: false,
    loadingMore: false,
  },
};