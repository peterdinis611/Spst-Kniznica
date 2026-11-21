import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResultsStatus } from "./ResultsStatus";

const meta = {
  title: "A11y/ResultsStatus",
  component: ResultsStatus,
  tags: ["autodocs"],
  args: {
    count: 12,
    labelSingular: "výsledok",
    labelPlural: "výsledkov",
    query: "orwell",
    pending: false,
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Živá oznamovacia správa pre čítačky obrazovky (`sr-only`, `aria-live=\"polite\"`). Vizuálne ju v UI nevidno — slúži len pre assistive technológie.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="rounded border border-dashed border-rule bg-card/30 p-4 text-sm text-muted-foreground">
          <strong className="text-ink">Poznámka:</strong> komponent je len pre čítačku obrazovky. Text nižšie
          zostáva skrytý (`sr-only`); v aplikácii ho používatelia bez AT nevidia.
        </div>
        <div className="relative min-h-[3rem] rounded border border-rule/60 bg-paper p-4">
          <span className="text-xs font-mono uppercase tracking-widest text-sage">
            Región výsledkov (vizuálne prázdny)
          </span>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ResultsStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {};

export const Singular: Story = {
  args: {
    count: 1,
    query: "kafka",
  },
};

export const Pending: Story = {
  args: {
    pending: true,
    count: 0,
    query: "sci-fi",
  },
};

export const WithoutQuery: Story = {
  args: {
    query: undefined,
    count: 48,
  },
};