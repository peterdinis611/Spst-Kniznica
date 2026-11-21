import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Správa pre knihovníka…",
    disabled: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-md space-y-2">
      <Label htmlFor="note">Poznámka k rezervácii</Label>
      <Textarea id="note" {...args} />
    </div>
  ),
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "",
  },
  render: (args) => (
    <div className="max-w-md space-y-2">
      <Label htmlFor="review">Recenzia</Label>
      <Textarea id="review" {...args} placeholder="Napíšte aspoň 20 znakov…" />
      <p className="text-sm text-destructive">Recenzia je príliš krátka.</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Túto poznámku už nie je možné upraviť.",
  },
};