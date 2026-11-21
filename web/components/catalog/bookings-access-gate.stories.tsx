import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { guestUser, readerUser, staffUser } from "@/.storybook/fixtures";
import { AbilityProvider } from "@/components/auth/AbilityProvider";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/auth/types";
import { BookingsAccessGate } from "./BookingsAccessGate";

function authDecorator(user: AuthUser | null, ready = true): Decorator {
  return (Story) => (
    <MockAuthProvider value={{ ready, user, entraEnabled: true }}>
      <AbilityProvider>
        <Story />
      </AbilityProvider>
    </MockAuthProvider>
  );
}

const meta = {
  title: "Catalog/BookingsAccessGate",
  component: BookingsAccessGate,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/bookings" },
    },
    docs: {
      description: {
        component:
          "Brána na výpožičný pult: loading / odmietnutie / Desk podľa CASL `access BookingsPage`.",
      },
    },
  },
} satisfies Meta<typeof BookingsAccessGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  name: "Načítanie",
  decorators: [authDecorator(null, false)],
};

export const HostOdmietnuty: Story = {
  name: "Host · odmietnutý",
  decorators: [authDecorator(guestUser)],
};

export const Citatel: Story = {
  name: "Čitateľ · pult",
  decorators: [authDecorator(readerUser)],
};

export const Personal: Story = {
  name: "Personál · pult",
  decorators: [authDecorator(staffUser)],
};
