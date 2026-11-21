import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogEmpty } from "./CatalogEmpty";

const meta = {
  title: "Catalog/CatalogEmpty",
  component: CatalogEmpty,
  tags: ["autodocs"],
  args: {
    title: "Žiadne výsledky",
    description:
      "Skúste upraviť filtre alebo hľadaný výraz — katalóg môže obsahovať iný názov.",
    resetHref: "/books",
    resetLabel: "Resetovať filtre",
  },
} satisfies Meta<typeof CatalogEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Favorites: Story = {
  args: {
    title: "Zatiaľ žiadne obľúbené",
    description: "Označte knihu hviezdičkou a objaví sa tu.",
    resetHref: "/books",
    resetLabel: "Prejsť do katalógu",
  },
};
