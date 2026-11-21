import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  sampleAuthors,
  sampleBooks,
  sampleCategories,
} from "@/.storybook/fixtures";
import { BooksCatalog } from "./BooksCatalog";

const shelfZones = [
  { id: "A", label: "Prízemie A" },
  { id: "B", label: "Poschodie B" },
  { id: "SF", label: "Sci-fi regál" },
];

const meta = {
  title: "Catalog/BooksCatalog",
  component: BooksCatalog,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: { pathname: "/books" },
    },
  },
  args: {
    initialBooks: sampleBooks,
    initialCategories: sampleCategories,
    initialAuthors: sampleAuthors,
    shelfZones,
  },
  decorators: [
    (Story) => (
      <div className="-m-8 min-h-[80vh]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BooksCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    initialBooks: [],
  },
};
