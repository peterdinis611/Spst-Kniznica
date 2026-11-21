import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Dostupné",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StockStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="rounded-full border-transparent bg-accent text-accent-foreground">
        Dostupné
      </Badge>
      <Badge className="rounded-full border-stair-1/40 bg-stair-1/15 text-stair-1">
        Málo kusov
      </Badge>
      <Badge className="rounded-full border-rule bg-paper text-muted-foreground">
        Nedostupné
      </Badge>
    </div>
  ),
};

export const Outline: Story = {
  args: { variant: "outline", children: "Katalóg" },
};
