import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkipToContent } from "./SkipToContent";
import { MainContent } from "./MainContent";

const meta = {
  title: "A11y/SkipToContent",
  component: SkipToContent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Odkaz na `#main-content` je bežne skrytý a **objaví sa po stlačení Tab** (fokus). V preview stlač Tab hneď po načítaní story.",
      },
    },
  },
} satisfies Meta<typeof SkipToContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-[50vh]">
      <SkipToContent />
      <p className="border-b border-rule bg-card/40 px-4 py-3 text-sm text-muted-foreground">
        Tip: stlač <kbd className="rounded border border-rule px-1.5 py-0.5 font-mono text-xs">Tab</kbd> — odkaz
        „Preskočiť na obsah“ sa zobrazí v ľavom hornom rohu.
      </p>
      <MainContent className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl text-ink">Hlavný obsah stránky</h1>
        <p className="mt-4 text-muted-foreground">
          Po aktivácii skip linku sa fokus presunie sem.
        </p>
      </MainContent>
    </div>
  ),
};