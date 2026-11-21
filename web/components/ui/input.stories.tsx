import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Hľadať knihu, autora…",
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="search">Vyhľadávanie</Label>
      <Input id="search" {...args} />
    </div>
  ),
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "???",
  },
  render: (args) => (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="isbn">ISBN</Label>
      <Input id="isbn" {...args} />
      <p className="text-sm text-destructive">Neplatný formát ISBN</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Len na čítanie",
  },
};
