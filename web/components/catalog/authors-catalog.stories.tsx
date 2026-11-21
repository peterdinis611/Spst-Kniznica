import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleAuthors } from "@/.storybook/fixtures";
import { AuthorsCatalog } from "./AuthorsCatalog";

const meta = {
  title: "Catalog/AuthorsCatalog",
  component: AuthorsCatalog,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: { pathname: "/authors" },
    },
  },
  args: {
    initialAuthors: sampleAuthors,
    initials: ["A", "G", "F", "K", "O", "S"],
  },
  decorators: [
    (Story) => (
      <div className="-m-8 min-h-[70vh]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthorsCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { initialAuthors: [] },
};
