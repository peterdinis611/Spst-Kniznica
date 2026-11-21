import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { readerUser } from "@/.storybook/fixtures";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import { LoginPanel, LoginPanelSkeleton } from "./LoginPanel";

const withGuestAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: null, entraEnabled: false }}>
    <Story />
  </MockAuthProvider>
);

const withReaderAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: readerUser, entraEnabled: false }}>
    <Story />
  </MockAuthProvider>
);

const withLoadingAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: false, user: null }}>
    <Story />
  </MockAuthProvider>
);

const meta = {
  title: "Auth/LoginPanel",
  component: LoginPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/login",
      },
    },
  },
} satisfies Meta<typeof LoginPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  name: "Host · prihlásenie",
  decorators: [withGuestAuth],
};

export const ReaderLoggedIn: Story = {
  name: "Čitateľ · preukaz",
  decorators: [withReaderAuth],
};

export const Loading: Story = {
  name: "Načítanie",
  decorators: [withLoadingAuth],
};

export const Skeleton: Story = {
  name: "Skeleton",
  render: () => <LoginPanelSkeleton />,
  decorators: [withLoadingAuth],
};