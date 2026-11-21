import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTrigger: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Rýchla rezervácia</PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Rezervovať exemplár</PopoverTitle>
          <PopoverDescription>
            Zadajte číslo exemplára z štítku na knihe.
          </PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-2">
          <Label htmlFor="exemplar">Číslo exemplára</Label>
          <Input id="exemplar" placeholder="napr. E-1042" />
          <Button size="sm" className="mt-1">
            Potvrdiť
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        Otvorené
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Stav skladu</PopoverTitle>
          <PopoverDescription>Posledná synchronizácia pred 5 minútami.</PopoverDescription>
        </PopoverHeader>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Dostupné: 128 titulov</li>
          <li>Výpožičky dnes: 14</li>
        </ul>
      </PopoverContent>
    </Popover>
  ),
};