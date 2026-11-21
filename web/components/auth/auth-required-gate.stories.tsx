import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthRequiredGate } from "./AuthRequiredGate";
import { RouteLoading } from "@/components/routing/RouteLoading";

const gateCopy = {
  eyebrow: "Moje výpožičky",
  description:
    "Výpožičné lístky a história sú dostupné len po prihlásení. Po Entra prihlásení sa tu zobrazia aktívne rezervácie.",
  hint: "Prihlás sa cez položku „Prihlásiť“ v hornej lište.",
} as const;

const meta = {
  title: "Auth/AuthRequiredGate",
  component: AuthRequiredGate,
  tags: ["autodocs"],
  args: {
    ready: true,
    allowed: true,
    eyebrow: gateCopy.eyebrow,
    description: gateCopy.description,
    hint: gateCopy.hint,
    loadingFallback: <RouteLoading variant="auth" />,
    children: (
      <div className="mx-auto w-full max-w-lg border border-rule bg-card/50 p-6 text-left">
        <p className="font-mono text-[11px] tracking-[0.2em] text-sage uppercase">
          Ukážkový obsah
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink">Aktívne výpožičky</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Toto je chránená časť — zobrazí sa len prihláseným používateľom.
        </p>
      </div>
    ),
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof AuthRequiredGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Allowed: Story = {
  args: {
    ready: true,
    allowed: true,
  },
};

export const Denied: Story = {
  args: {
    ready: true,
    allowed: false,
  },
};

export const Loading: Story = {
  args: {
    ready: false,
    allowed: false,
  },
};