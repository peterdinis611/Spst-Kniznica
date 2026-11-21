import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lines: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ),
};

export const BookCard: Story = {
  render: () => (
    <div className="flex max-w-sm gap-4">
      <Skeleton className="size-24 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-auto h-8 w-24 rounded-md" />
      </div>
    </div>
  ),
};

export const Circle: Story = {
  render: () => <Skeleton className="size-10 rounded-full" />,
};