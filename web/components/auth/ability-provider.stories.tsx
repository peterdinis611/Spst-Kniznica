import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  adminUser,
  guestUser,
  readerUser,
  staffUser,
} from "@/.storybook/fixtures";
import { AbilityProvider, Can, useAbility } from "./AbilityProvider";
import { MockAuthProvider } from "./AuthProvider";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

function authDecorator(user: AuthUser | null, ready = true): Decorator {
  return (Story) => (
    <MockAuthProvider value={{ ready, user }}>
      <AbilityProvider>
        <Story />
      </AbilityProvider>
    </MockAuthProvider>
  );
}

function AbilityMatrix() {
  const ability = useAbility();
  const rows = [
    { action: "access" as const, subject: "BookingsPage" as const, label: "Výpožičky (prístup)" },
    { action: "manage" as const, subject: "BookingsDesk" as const, label: "Pult (správa)" },
    { action: "access" as const, subject: "AdminPage" as const, label: "Admin (prístup)" },
    { action: "manage" as const, subject: "AdminPage" as const, label: "Admin (správa)" },
  ];

  return (
    <div className="max-w-lg space-y-4">
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        CASL · AbilityProvider
      </p>
      <ul className="divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10">
        {rows.map((row) => {
          const allowed = ability.can(row.action, row.subject);
          return (
            <li
              key={`${row.action}-${row.subject}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span>{row.label}</span>
              <span
                className={cn(
                  "font-mono text-[11px] tracking-wide uppercase",
                  allowed ? "text-sage" : "text-stair-2",
                )}
              >
                {allowed ? "áno" : "nie"}
              </span>
            </li>
          );
        })}
      </ul>
      <Can I="manage" a="BookingsDesk">
        <p className="border border-sage/40 bg-sage/10 px-3 py-2 text-sm text-ink">
          Viditeľné len pre personál s <code>manage BookingsDesk</code>.
        </p>
      </Can>
      <Can I="manage" a="AdminPage">
        <p className="border border-stair-2/40 bg-stair-2/10 px-3 py-2 text-sm text-ink">
          Viditeľné len pre admina s <code>manage AdminPage</code>.
        </p>
      </Can>
    </div>
  );
}

const meta = {
  title: "Auth/AbilityProvider",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "CASL ability podľa `MockAuthProvider` používateľa. Matica práv + podmienkové `Can` bloky.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Host: Story = {
  name: "Host",
  decorators: [authDecorator(guestUser)],
  render: () => <AbilityMatrix />,
};

export const Citatel: Story = {
  name: "Čitateľ",
  decorators: [authDecorator(readerUser)],
  render: () => <AbilityMatrix />,
};

export const Personal: Story = {
  name: "Personál",
  decorators: [authDecorator(staffUser)],
  render: () => <AbilityMatrix />,
};

export const Admin: Story = {
  name: "Admin",
  decorators: [authDecorator(adminUser)],
  render: () => <AbilityMatrix />,
};
