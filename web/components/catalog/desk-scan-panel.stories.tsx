import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  guestUser,
  readerUser,
  sampleDeskBookings,
  staffUser,
} from "@/.storybook/fixtures";
import { AbilityProvider } from "@/components/auth/AbilityProvider";
import { MockAuthProvider } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/auth/types";
import { DeskScanPanel } from "./DeskScanPanel";

function authDecorator(user: AuthUser | null): Decorator {
  return (Story) => (
    <MockAuthProvider value={{ ready: true, user }}>
      <AbilityProvider>
        <div className="mx-auto max-w-xl">
          <Story />
        </div>
      </AbilityProvider>
    </MockAuthProvider>
  );
}

const meta = {
  title: "Catalog/DeskScanPanel",
  component: DeskScanPanel,
  tags: ["autodocs"],
  args: {
    deskBookings: sampleDeskBookings,
    scanFocus: true,
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Skener výtlačkov na výpožičnom pulte. Pre hosta/čitateľa vracia `null` (chýba `manage BookingsDesk`). Lookup akcie v Storybooku zlyhajú — UI formulára je statické.",
      },
    },
  },
} satisfies Meta<typeof DeskScanPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {
  name: "Personál",
  decorators: [authDecorator(staffUser)],
};

export const CitatelSkryte: Story = {
  name: "Čitateľ · skryté",
  decorators: [authDecorator(readerUser)],
  render: (args) => (
    <>
      <DeskScanPanel {...args} />
      <p className="mt-4 text-sm text-muted-foreground">
        Panel sa nevykreslí — používateľ nemá `manage BookingsDesk`.
      </p>
    </>
  ),
};

export const HostSkryte: Story = {
  name: "Host · skryté",
  decorators: [authDecorator(guestUser)],
  render: (args) => (
    <>
      <DeskScanPanel {...args} />
      <p className="mt-4 text-sm text-muted-foreground">
        Panel sa nevykreslí pre neprihláseného používateľa.
      </p>
    </>
  ),
};
