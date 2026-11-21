import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppOnboarding } from "./AppOnboarding";

const meta = {
  title: "Onboarding/AppOnboarding",
  component: AppOnboarding,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Štvorkrokový sprievodca výpožičkou. Stav „skryté“ ukladá do `localStorage` (`spst-onboarding-dismissed`).",
      },
    },
  },
} satisfies Meta<typeof AppOnboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <AppOnboarding {...args} className="mx-auto max-w-6xl" />,
};