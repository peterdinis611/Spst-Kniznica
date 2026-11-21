import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RouteError } from "./RouteError";

const meta = {
  title: "Routing/RouteError",
  component: RouteError,
  tags: ["autodocs"],
  args: {
    error: new Error("API 502 — gateway timeout pri načítaní katalógu"),
    reset: fn(),
    homeHref: "/",
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Obal okolo `HttpStatusPanel`: kód HTTP odvodí z textu chyby (`401`, `404`, `500`, `502`, `503`), inak 500.",
      },
    },
  },
} satisfies Meta<typeof RouteError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GatewayError: Story = {
  args: {
    error: new Error("API 502 — brána neodpovedá"),
  },
};

export const Unauthorized: Story = {
  args: {
    error: new Error("API 401 — session expired"),
  },
};

export const NotFound: Story = {
  args: {
    error: new Error("Požiadavka skončila s 404"),
  },
};

export const GenericServerError: Story = {
  name: "Neznáma chyba (500)",
  args: {
    error: new Error("Unexpected serialization failure"),
    title: "Katalóg sa nepodarilo načítať",
    description:
      "Skús obnoviť stránku. Ak problém pretrváva, napíš správcovi knižnice.",
  },
};