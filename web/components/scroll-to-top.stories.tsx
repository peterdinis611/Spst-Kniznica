import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollToTop } from "./scroll-to-top";

const meta = {
  title: "Misc/ScrollToTop",
  component: ScrollToTop,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Plovúce tlačidlo sa zobrazí po scrollnutí pod ~420 px. Posuň stránku dole, aby sa objavilo.",
      },
    },
  },
} satisfies Meta<typeof ScrollToTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
  <>
      <ScrollToTop />
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <h1 className="font-display text-4xl text-ink">Dlhá ukážková stránka</h1>
        <p className="text-muted-foreground">
          Posuň obsah nadol — po prekročení prahu sa v pravom dolnom rohu objaví tlačidlo „Späť nahor“.
        </p>
        {Array.from({ length: 24 }, (_, i) => (
          <section
            key={i}
            className="border-l-2 border-accent/40 py-2 pl-4"
          >
            <h2 className="font-display text-xl text-ink">Sekcia {i + 1}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ukážkový odsek katalógu SPST — knižnica, výpožičky a rezervácie cez školskú API bránu.
            </p>
          </section>
        ))}
      </article>
    </>
  ),
};