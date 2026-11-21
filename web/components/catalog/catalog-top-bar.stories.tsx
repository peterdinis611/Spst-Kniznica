import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCategories } from "@/.storybook/fixtures";
import { CatalogTopBar } from "./CatalogTopBar";

const categories = sampleCategories.map(({ id, name }) => ({ id, name }));

const meta = {
  title: "Catalog/CatalogTopBar",
  component: CatalogTopBar,
  tags: ["autodocs"],
  args: {
    eyebrow: "Katalóg",
    title: "Knižný fond",
    lead: "Tituly, autori a dostupnosť exemplárov v jednom prehľade.",
    categories,
    defaultQuery: "",
    searchAction: "/books",
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
} satisfies Meta<typeof CatalogTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoVyhladanim: Story = {
  name: "So vyhľadávaním",
  args: {
    showSearch: true,
    defaultQuery: "kafka",
  },
};

export const BezVyhladania: Story = {
  name: "Bez vyhľadávania",
  args: {
    showSearch: false,
  },
};