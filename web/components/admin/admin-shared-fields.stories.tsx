import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RecordContextProvider, SimpleShowLayout } from "react-admin";
import {
  adminBookStockEmpty,
  adminBookStockLow,
  adminBookStockOk,
  adminBookingActive,
  adminBookingOverdue,
  adminBookingReserved,
} from "@/.storybook/fixtures";
import { AdminStoryShell } from "@/.storybook/admin-decorators";
import {
  ActiveChipField,
  BookingStatusField,
  ColorSwatchField,
  MetaDates,
  SectionTitle,
  StockField,
} from "./shared";

function FieldRow({
  title,
  record,
  children,
}: {
  title: string;
  record: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 border border-rule p-4 dark:border-white/10">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        {title}
      </p>
      <RecordContextProvider value={{ id: "x", ...record }}>
        <SimpleShowLayout>{children}</SimpleShowLayout>
      </RecordContextProvider>
    </div>
  );
}

const meta = {
  title: "Admin/SharedFields",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Zdieľané react-admin polia: stav výpožičky, fond, aktívny chip, farba, meta dátumy.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusAndStock: Story = {
  name: "Stavy a fond",
  render: () => (
    <AdminStoryShell>
      <div className="grid max-w-3xl gap-4 p-4 md:grid-cols-2">
        <FieldRow title="Rezervované" record={adminBookingReserved}>
          <BookingStatusField />
        </FieldRow>
        <FieldRow title="Požičané" record={adminBookingActive}>
          <BookingStatusField />
        </FieldRow>
        <FieldRow title="Po termíne" record={adminBookingOverdue}>
          <BookingStatusField />
        </FieldRow>
        <FieldRow title="Fond OK" record={adminBookStockOk}>
          <StockField />
        </FieldRow>
        <FieldRow title="Fond nízky" record={adminBookStockLow}>
          <StockField />
        </FieldRow>
        <FieldRow title="Fond prázdny" record={adminBookStockEmpty}>
          <StockField />
        </FieldRow>
        <FieldRow title="Aktívny" record={{ isActive: true }}>
          <ActiveChipField />
        </FieldRow>
        <FieldRow title="Neaktívny" record={{ isActive: false }}>
          <ActiveChipField />
        </FieldRow>
        <FieldRow title="Farba" record={{ color: "#4d7356" }}>
          <ColorSwatchField />
        </FieldRow>
        <FieldRow
          title="Meta"
          record={{
            id: "book-1984",
            createdAt: "2026-01-10T10:00:00.000Z",
            updatedAt: "2026-03-01T14:30:00.000Z",
          }}
        >
          <SectionTitle>Metadáta</SectionTitle>
          <MetaDates />
        </FieldRow>
      </div>
    </AdminStoryShell>
  ),
};
