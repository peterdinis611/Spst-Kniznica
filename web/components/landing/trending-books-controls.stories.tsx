import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendingBooksControls } from "./TrendingBooksControls";

const mockScroller = (
  <div
    data-trending-scroller
    className="mt-6 flex gap-4 overflow-x-auto border border-dashed border-rule p-4"
  >
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex h-24 w-32 shrink-0 items-center justify-center bg-paper-deep text-xs text-muted-foreground"
      >
        Kniha {i + 1}
      </div>
    ))}
  </div>
);

const meta = {
  title: "Landing/TrendingBooksControls",
  component: TrendingBooksControls,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof TrendingBooksControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hlavicka: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
        {mockScroller}
      </div>
    ),
  ],
  render: () => (
    <TrendingBooksControls>
      <h2 className="flex-1 text-center font-display text-2xl text-ink uppercase">
        Populárne tituly
      </h2>
    </TrendingBooksControls>
  ),
};

export const MobilneOvladanie: Story = {
  args: {
    placement: "mobile",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm">
        <div data-trending-scroller className="hidden" aria-hidden />
        <Story />
        {mockScroller}
      </div>
    ),
  ],
};