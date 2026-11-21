import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div>
        <p className="text-sm font-medium">Katalóg</p>
        <p className="text-sm text-muted-foreground">Prehľadávanie kníh SPST</p>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium">Výpožičky</p>
        <p className="text-sm text-muted-foreground">Aktívne a história</p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-4 text-sm">
      <span>Domov</span>
      <Separator orientation="vertical" />
      <span>Katalóg</span>
      <Separator orientation="vertical" />
      <span className="text-muted-foreground">Účet</span>
    </div>
  ),
};