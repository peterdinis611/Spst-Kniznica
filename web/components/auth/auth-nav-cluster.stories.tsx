import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { readerUser, staffUser } from "@/.storybook/fixtures";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import { AuthNavCluster } from "./AuthNavCluster";

const withLoadingAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: false, user: null }}>
    <Story />
  </MockAuthProvider>
);

const withGuestAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: null }}>
    <Story />
  </MockAuthProvider>
);

const withReaderAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: readerUser }}>
    <Story />
  </MockAuthProvider>
);

const withStaffAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: staffUser }}>
    <Story />
  </MockAuthProvider>
);

const meta = {
  title: "Auth/AuthNavCluster",
  component: AuthNavCluster,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Kompaktný auth prepínač v hlavičke — stavy načítania, hosta, čitateľa a personálu cez `MockAuthProvider`.",
      },
    },
  },
} satisfies Meta<typeof AuthNavCluster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  name: "Načítanie",
  decorators: [withLoadingAuth],
};

export const Guest: Story = {
  name: "Host",
  decorators: [withGuestAuth],
};

export const Reader: Story = {
  name: "Čitateľ",
  decorators: [withReaderAuth],
};

export const Staff: Story = {
  name: "Personál",
  decorators: [withStaffAuth],
};