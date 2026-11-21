import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandLogo } from "./brand-logo";

const meta = {
  title: "Brand/BrandLogo",
  component: BrandLogo,
  tags: ["autodocs"],
  args: {
    href: "/",
    showDot: true,
  },
} satisfies Meta<typeof BrandLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDot: Story = {
  args: { showDot: false },
};

export const OnNav: Story = {
  render: (args) => (
    <header className="flex items-center justify-between border-b border-rule pb-4">
      <BrandLogo {...args} />
      <span className="text-sm text-muted-foreground">Katalóg · Autori</span>
    </header>
  ),
};
