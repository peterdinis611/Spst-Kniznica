import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { NavigationProgress } from "./NavigationProgress";

const meta = {
  title: "Routing/NavigationProgress",
  component: NavigationProgress,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: { pathname: "/" },
    },
    docs: {
      description: {
        component:
          "Tenký progress bar pri klientskom navigovaní. Klikni na link nižšie a sleduj horný okraj.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative -m-8 min-h-[40vh]">
        <Story />
        <div className="space-y-3 p-8">
          <p className="text-sm text-muted-foreground">
            Progress sa spustí pri kliknutí na interný odkaz.
          </p>
          <div className="flex gap-3">
            <Link className="text-accent underline" href="/books">
              Katalóg
            </Link>
            <Link className="text-accent underline" href="/authors">
              Autori
            </Link>
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof NavigationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
