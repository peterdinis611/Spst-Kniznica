import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MainContent } from "./MainContent";

const meta = {
  title: "A11y/MainContent",
  component: MainContent,
  tags: ["autodocs"],
  args: {
    children: (
      <>
        <h1 className="font-display text-3xl text-ink">Katalóg kníh</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Landmark <code className="text-ink">&lt;main&gt;</code> s id <code className="text-ink">main-content</code> —
          cieľ skip linku a správa fokusu po navigácii.
        </p>
      </>
    ),
    className: "mx-auto max-w-2xl px-4 py-10",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MainContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};