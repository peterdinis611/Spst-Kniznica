import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AdminLoginPage } from "./AdminLoginPage";

const blockRedirect: Decorator = (Story) => {
  const assignMock = fn();
  window.location.assign = assignMock as typeof window.location.assign;

  return (
    <>
      <Story />
    </>
  );
};

const meta = {
  title: "Admin/AdminLoginPage",
  component: AdminLoginPage,
  tags: ["autodocs"],
  decorators: [blockRedirect],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Presmeruje na `/login?next=/admin`. V Storybooki je `location.assign` zablokovaný, aby zostala viditeľná správa „Presmerovávam…“.",
      },
    },
  },
} satisfies Meta<typeof AdminLoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};