import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RightPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Filtre katalógu</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filtre</SheetTitle>
          <SheetDescription>Spresnite výber v školskej knižnici SPST.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 px-4 text-sm text-muted-foreground">
          <p>Žáner, dostupnosť, jazyk…</p>
        </div>
        <SheetFooter>
          <Button className="w-full">Použiť filtre</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const OpenFromLeft: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigácia</SheetTitle>
          <SheetDescription>Katalóg, výpožičky, môj účet.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 px-4 text-sm">
          <span className="font-medium text-foreground">Katalóg</span>
          <span className="text-muted-foreground">Moje výpožičky</span>
          <span className="text-muted-foreground">Rezervácie</span>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};