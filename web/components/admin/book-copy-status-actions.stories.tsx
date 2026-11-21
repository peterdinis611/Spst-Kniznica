import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  adminBookCopyAvailable,
  adminBookCopyDamaged,
} from "@/.storybook/fixtures";
import { withAdminRecord } from "@/.storybook/admin-decorators";
import { BookCopyStatusActions } from "./BookCopyStatusActions";

const meta = {
  title: "Admin/BookCopyStatusActions",
  component: BookCopyStatusActions,
  tags: ["autodocs"],
  args: {
    bookId: "book-1984",
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Prepínače stavu výtlačku (dostupný / poškodený / vyradený). `RecordContext` nesie aktuálny copy; PATCH v Storybooku zlyhá — UI tlačidlá podľa stavu.",
      },
    },
  },
} satisfies Meta<typeof BookCopyStatusActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  name: "Dostupný",
  decorators: [withAdminRecord(adminBookCopyAvailable)],
};

export const Damaged: Story = {
  name: "Poškodený",
  decorators: [withAdminRecord(adminBookCopyDamaged)],
};
