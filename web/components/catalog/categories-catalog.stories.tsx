import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleCategories } from "@/.storybook/fixtures";
import { CategoriesCatalog } from "./CategoriesCatalog";

const meta = {
  title: "Catalog/CategoriesCatalog",
  component: CategoriesCatalog,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: { pathname: "/categories" },
    },
  },
  args: {
    initialCategories: sampleCategories,
  },
  decorators: [
    (Story) => (
      <div className="-m-8 min-h-[70vh]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoriesCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { initialCategories: [] },
};
