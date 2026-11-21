import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { HttpStatusPanel } from "./HttpStatusPanel";
import type { HttpStatusCode } from "@/lib/routing/http-status";

const STATUS_CODES: HttpStatusCode[] = [401, 404, 429, 500, 502, 503];

const meta = {
  title: "Routing/HttpStatusPanel",
  component: HttpStatusPanel,
  tags: ["autodocs"],
  args: {
    code: 404 as HttpStatusCode,
    onRetry: fn(),
  },
  argTypes: {
    code: {
      control: "select",
      options: STATUS_CODES,
    },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "HTTP chybové panely so slovenským copy z `HTTP_STATUS_COPY`. Kódy 502 a 503 periodicky volajú `/health` — v Storybooki môže prebiehať polling na pozadí, panel sa však normálne vykreslí.",
      },
    },
  },
} satisfies Meta<typeof HttpStatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Unauthorized: Story = {
  args: { code: 401 },
};

export const NotFound: Story = {
  args: { code: 404 },
};

export const RateLimited: Story = {
  args: { code: 429 },
};

export const ServerError: Story = {
  args: { code: 500 },
};

export const BadGateway: Story = {
  name: "Bad gateway (502)",
  args: { code: 502 },
};

export const ServiceUnavailable: Story = {
  name: "Service unavailable (503)",
  args: { code: 503 },
};