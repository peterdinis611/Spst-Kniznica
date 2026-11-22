import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  adminBookCopyAvailable,
  adminBookCopyBorrowed,
  adminBookCopyLost,
  adminBookCopyMaintenance,
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
          "Prepínače stavu výtlačku (dostupný / stratený / údržba). Požičaný a rezervovaný výtlačok prepínač nemá — stav mení výpožička. `RecordContext` nesie aktuálny copy; PATCH v Storybooku zlyhá.",
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

export const Lost: Story = {
  name: "Stratený",
  decorators: [withAdminRecord(adminBookCopyLost)],
};

export const Maintenance: Story = {
  name: "Údržba",
  decorators: [withAdminRecord(adminBookCopyMaintenance)],
};

export const Borrowed: Story = {
  name: "Požičaný",
  decorators: [withAdminRecord(adminBookCopyBorrowed)],
};
