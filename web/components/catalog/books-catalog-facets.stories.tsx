import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  emptyCatalogFilters,
  sampleAuthors,
  sampleCatalogFilters,
  sampleCategories,
} from "@/.storybook/fixtures";
import { BooksCatalogFacets } from "./BooksCatalogFacets";

const meta = {
  title: "Catalog/BooksCatalogFacets",
  component: BooksCatalogFacets,
  tags: ["autodocs"],
  args: {
    liveQuery: "",
    categories: sampleCategories,
    authors: sampleAuthors,
    filterCount: 0,
    resultCount: 237,
    resultsPending: false,
    onOpenAdvanced: fn(),
    filtersOpen: false,
  },
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/books",
      },
    },
  },
} satisfies Meta<typeof BooksCatalogFacets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BezFiltrov: Story = {
  name: "Bez aktívnych filtrov",
  args: {
    filters: emptyCatalogFilters,
    liveQuery: "",
  },
};

export const AktivneFiltre: Story = {
  name: "Aktívne filtre",
  args: {
    filters: sampleCatalogFilters,
    liveQuery: sampleCatalogFilters.q ?? "",
    filterCount: 2,
    resultCount: 3,
  },
};

export const NacitavanieVysledkov: Story = {
  name: "Načítavanie výsledkov",
  args: {
    filters: sampleCatalogFilters,
    liveQuery: "orwell",
    resultsPending: true,
    filterCount: 1,
  },
};