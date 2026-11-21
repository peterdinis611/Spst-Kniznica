import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, Library, Search } from "@/components/icons";
import { Button } from "./button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

const meta = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InlinePalette: Story = {
  render: () => (
    <Command className="max-w-md border shadow-md">
      <CommandInput placeholder="Hľadať knihu, autora, ISBN…" />
      <CommandList>
        <CommandEmpty>Nič sa nenašlo.</CommandEmpty>
        <CommandGroup heading="Navigácia">
          <CommandItem>
            <Library className="size-4" aria-hidden />
            Katalóg kníh
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <BookOpen className="size-4" aria-hidden />
            Moje výpožičky
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Posledné">
          <CommandItem>1984 — George Orwell</CommandItem>
          <CommandItem>Malý princ — Antoine de Saint-Exupéry</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const DialogOpen: Story = {
  render: () => (
    <CommandDialog
      defaultOpen
      title="Rýchle hľadanie"
      description="Vyhľadajte v katalógu SPST Knižnica"
    >
      <Command>
        <CommandInput placeholder="Zadajte názov alebo autora…" />
        <CommandList>
          <CommandEmpty>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Search className="size-4" aria-hidden />
              Skúste kratší výraz
            </span>
          </CommandEmpty>
          <CommandGroup heading="Návrhy">
            <CommandItem>Programovanie v C#</CommandItem>
            <CommandItem>Dejiny Slovenska</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  ),
};

export const WithTrigger: Story = {
  render: function WithTriggerStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" type="button" onClick={() => setOpen(true)}>
          Otvoriť paletu
        </Button>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Paleta príkazov"
          description="Rýchla navigácia v knižnici"
        >
          <Command>
            <CommandInput placeholder="Hľadať…" />
            <CommandList>
              <CommandItem>Domov</CommandItem>
              <CommandItem>Katalóg</CommandItem>
              <CommandItem>Moje výpožičky</CommandItem>
            </CommandList>
          </Command>
        </CommandDialog>
      </>
    );
  },
};