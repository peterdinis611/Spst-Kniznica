import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Požičať knihu",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accent: Story = {
  args: {
    children: "Rezervovať",
    className: "rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent-deep",
  },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Zrušiť" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Viac info" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Odstrániť" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Nedostupné" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">XS</Button>
      <Button size="sm">SM</Button>
      <Button size="default">Default</Button>
      <Button size="lg">LG</Button>
    </div>
  ),
};
