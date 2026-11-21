import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  adminBookingActive,
  adminBookingOverdue,
  adminBookingReserved,
} from "@/.storybook/fixtures";
import { withAdminRecord } from "@/.storybook/admin-decorators";
import { BookingQuickActions } from "./BookingQuickActions";

const meta = {
  title: "Admin/BookingQuickActions",
  component: BookingQuickActions,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Rýchle akcie výpožičky (vydať / vrátiť / predĺžiť / zrušiť). Vyžaduje `RecordContext` + react-admin. API volania v Storybooku zlyhajú — UI stavy podľa `status`.",
      },
    },
  },
} satisfies Meta<typeof BookingQuickActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reserved: Story = {
  name: "Rezervované · vydať / zrušiť",
  decorators: [withAdminRecord(adminBookingReserved)],
};

export const Active: Story = {
  name: "Požičané · vrátiť / predĺžiť",
  decorators: [withAdminRecord(adminBookingActive)],
};

export const Overdue: Story = {
  name: "Po termíne · vrátiť / predĺžiť",
  decorators: [withAdminRecord(adminBookingOverdue)],
};
