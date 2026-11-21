import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { guestUser, readerUser, staffUser } from "@/.storybook/fixtures";
import { AbilityProvider } from "@/components/auth/AbilityProvider";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import { SiteHeader } from "./SiteHeader";

function authDecorator(
  user: typeof guestUser | typeof readerUser | typeof staffUser,
  ready = true,
): Decorator {
  return (Story) => (
    <MockAuthProvider value={{ ready, user }}>
      <AbilityProvider>
        <Story />
      </AbilityProvider>
    </MockAuthProvider>
  );
}

const meta = {
  title: "Landing/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GuestDomov: Story = {
  name: "Host · domov",
  decorators: [authDecorator(guestUser)],
  parameters: {
    nextjs: {
      navigation: { pathname: "/" },
    },
  },
};

export const GuestKatalog: Story = {
  name: "Host · katalóg",
  decorators: [authDecorator(guestUser)],
  parameters: {
    nextjs: {
      navigation: { pathname: "/books" },
    },
  },
};

export const Reader: Story = {
  name: "Čitateľ",
  decorators: [authDecorator(readerUser)],
  parameters: {
    nextjs: {
      navigation: { pathname: "/books" },
    },
  },
};

export const Staff: Story = {
  name: "Personál",
  decorators: [authDecorator(staffUser)],
  parameters: {
    nextjs: {
      navigation: { pathname: "/" },
    },
  },
};