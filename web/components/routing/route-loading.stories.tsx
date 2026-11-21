import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RouteLoading } from "./RouteLoading";

const VARIANTS = ["landing", "catalog", "detail", "auth", "admin", "status"] as const;

const meta = {
  title: "Routing/RouteLoading",
  component: RouteLoading,
  tags: ["autodocs"],
  args: {
    variant: "catalog",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [...VARIANTS],
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RouteLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Landing: Story = {
  args: { variant: "landing" },
};

export const Catalog: Story = {
  args: { variant: "catalog" },
};

export const Detail: Story = {
  args: { variant: "detail" },
};

export const Auth: Story = {
  args: { variant: "auth" },
};

export const Admin: Story = {
  args: { variant: "admin" },
};

export const Status: Story = {
  args: { variant: "status" },
};