import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Čitateľský preukaz",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="card-id">Číslo preukazu</Label>
      <Input id="card-id" placeholder="SPST-2026-0142" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <Label htmlFor="email">
      Školský e-mail
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </Label>
  ),
};