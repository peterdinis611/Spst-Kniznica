import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SileoToaster } from "./SileoToaster";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        className="rounded-none bg-accent text-accent-foreground hover:bg-accent-deep"
        onClick={() =>
          toast.success({
            title: "Rezervácia uložená",
            description: "Lístok nájdeš v časti Moja knižnica.",
          })
        }
      >
        Úspech
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-none border-rule"
        onClick={() =>
          toast.warning({
            title: "Blíži sa termín",
            description: "Vráť Process do piatku, aby si nestratil výpožičku.",
          })
        }
      >
        Upozornenie
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-none border-rule"
        onClick={() =>
          toast.library({
            title: "Vitaj v knižnici",
            description: "Turnus s fondom 2 400 titulov je otvorený.",
            iconName: "spark",
          })
        }
      >
        Knižnica
      </Button>
      <SileoToaster />
    </div>
  );
}

const meta = {
  title: "Toast/SileoToaster",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Globálny `Sileo` toaster; v aplikácii volaj `toast.*` z `@/lib/toast`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  name: "Interaktívne toasty",
  render: () => <ToastDemo />,
};