import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { guestUser, readerUser } from "@/.storybook/fixtures";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/auth/types";
import { FavoriteToggle } from "./FavoriteToggle";

function authDecorator(user: AuthUser | null): Decorator {
  return (Story) => (
    <MockAuthProvider value={{ ready: true, user }}>
      <Story />
    </MockAuthProvider>
  );
}

const meta = {
  title: "Catalog/FavoriteToggle",
  component: FavoriteToggle,
  tags: ["autodocs"],
  args: {
    bookId: "book-1984",
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Srdiečko obľúbených. Pre hosta `null`; pre čitateľa tlačidlo (list favorites API v SB zlyhá — východzí stav neaktívny).",
      },
    },
  },
} satisfies Meta<typeof FavoriteToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Citatel: Story = {
  name: "Čitateľ",
  decorators: [authDecorator(readerUser)],
};

export const HostSkryte: Story = {
  name: "Host · skryté",
  decorators: [authDecorator(guestUser)],
  render: (args) => (
    <div className="space-y-3 text-center">
      <FavoriteToggle {...args} />
      <p className="text-sm text-muted-foreground">
        Pre neprihláseného sa toggle nevykreslí.
      </p>
    </div>
  ),
};
