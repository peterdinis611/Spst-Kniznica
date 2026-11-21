import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { readerUser, sampleBook } from "@/.storybook/fixtures";
import { LiveAnnouncerProvider } from "@/components/a11y/LiveAnnouncer";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import { ReserveSlip } from "./ReserveSlip";

const withGuestAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: null, entraEnabled: false }}>
    <LiveAnnouncerProvider>
      <Story />
    </LiveAnnouncerProvider>
  </MockAuthProvider>
);

const withReaderAuth: Decorator = (Story) => (
  <MockAuthProvider value={{ ready: true, user: readerUser, entraEnabled: false }}>
    <LiveAnnouncerProvider>
      <Story />
    </LiveAnnouncerProvider>
  </MockAuthProvider>
);

const meta = {
  title: "Catalog/ReserveSlip",
  component: ReserveSlip,
  tags: ["autodocs"],
  args: {
    bookId: sampleBook.id,
    title: sampleBook.title,
    available: true,
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ReserveSlip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  name: "Host · výzva na prihlásenie",
  decorators: [withGuestAuth],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = await canvas.findByRole("button", {
      name: /rezervovať titul/i,
    });
    await userEvent.click(openButton);
  },
};

export const Reader: Story = {
  name: "Čitateľ · formulár",
  decorators: [withReaderAuth],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = await canvas.findByRole("button", {
      name: /rezervovať titul/i,
    });
    await userEvent.click(openButton);
  },
};

export const Obsadene: Story = {
  name: "Fond obsadený",
  args: {
    available: false,
  },
  decorators: [withReaderAuth],
};