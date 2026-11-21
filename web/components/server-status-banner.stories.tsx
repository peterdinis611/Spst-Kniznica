import { useEffect, type ReactNode } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ServerStatusBanner } from "./server-status-banner";

function HealthFetchMock({
  ok,
  children,
}: {
  ok: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes("/health")) {
        if (!ok) {
          return Promise.reject(new TypeError("Failed to fetch"));
        }
        return new Response("{}", { status: 200 });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
  }, [ok]);

  return (
    <div className="-m-8">
      {children}
      <div className="p-8 text-sm text-muted-foreground">
        {ok
          ? "Pri online stave je banner skrytý (null)."
          : "Banner sa zobrazí po zlyhaní /health."}
      </div>
    </div>
  );
}

function mockHealth(ok: boolean): Decorator {
  return (Story) => (
    <HealthFetchMock ok={ok}>
      <Story />
    </HealthFetchMock>
  );
}

const meta = {
  title: "System/ServerStatusBanner",
  component: ServerStatusBanner,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Globálny banner pri nedostupnej API bráne. Polling ~8 s; v stories mockujeme `fetch` na `/health`.",
      },
    },
  },
} satisfies Meta<typeof ServerStatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  name: "Odpojené",
  decorators: [mockHealth(false)],
};

export const OnlineHidden: Story = {
  name: "Online · skryté",
  decorators: [mockHealth(true)],
};
