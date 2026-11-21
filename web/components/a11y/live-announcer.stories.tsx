import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { LiveAnnouncerProvider, useAnnounce } from "./LiveAnnouncer";

function AnnounceDemo() {
  const announce = useAnnounce();

  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Správy idú do `aria-live` regiónov (sr-only). Skontroluj ich vo VoiceOver /
        NVDA alebo v Accessibility paneli.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={() => announce("Rezervácia bola vytvorená.", "polite")}
        >
          Polite oznam
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={() =>
            announce("Výpožička je po termíne — vyžaduje pozornosť.", "assertive")
          }
        >
          Assertive oznam
        </Button>
      </div>
    </div>
  );
}

const meta = {
  title: "A11y/LiveAnnouncer",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "`LiveAnnouncerProvider` + `useAnnounce` pre screen reader oznamy (polite / assertive).",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  name: "Oznamy",
  render: () => (
    <LiveAnnouncerProvider>
      <AnnounceDemo />
    </LiveAnnouncerProvider>
  ),
};
