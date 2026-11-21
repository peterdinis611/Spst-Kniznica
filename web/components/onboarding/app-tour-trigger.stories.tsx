import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppTourTrigger } from "./AppTourTrigger";

const meta = {
  title: "Onboarding/AppTourTrigger",
  component: AppTourTrigger,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
    },
    docs: {
      description: {
        component:
          "Tlačidlo spúšťajúce driver.js prehliadku. Na úzkych displejoch je skryté (`sm+`).",
      },
    },
  },
} satisfies Meta<typeof AppTourTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Predvolené",
};
