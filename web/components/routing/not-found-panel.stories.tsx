import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotFoundPanel } from "./NotFoundPanel";

const meta = {
  title: "Routing/NotFoundPanel",
  component: NotFoundPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tenký wrapper okolo `HttpStatusPanel` s kódom 404. Uprednostňuj priamo `HttpStatusPanel` s `code={404}`.",
      },
    },
  },
} satisfies Meta<typeof NotFoundPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};