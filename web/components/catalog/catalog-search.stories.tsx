import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCategories } from "@/.storybook/fixtures";
import { CatalogSearch } from "./CatalogSearch";

const categories = sampleCategories.map(({ id, name }) => ({ id, name }));

const meta = {
  title: "Catalog/CatalogSearch",
  component: CatalogSearch,
  tags: ["autodocs"],
  args: {
    categories,
    placeholder: "Názov, autor alebo téma…",
    showCategory: true,
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
} satisfies Meta<typeof CatalogSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrazdnyDotaz: Story = {
  name: "Prázdny dotaz",
  args: {
    defaultQuery: "",
    defaultCategory: "",
  },
};

export const PredvyplnenyDotaz: Story = {
  name: "Predvyplnený dotaz",
  args: {
    defaultQuery: "orwell",
    defaultCategory: "",
  },
};

export const SKategoriou: Story = {
  name: "Dotaz + kategória",
  args: {
    defaultQuery: "dystopia",
    defaultCategory: "cat-scifi",
  },
};

export const BezKategorie: Story = {
  name: "Bez výberu kategórie",
  args: {
    defaultQuery: "",
    showCategory: false,
  },
};