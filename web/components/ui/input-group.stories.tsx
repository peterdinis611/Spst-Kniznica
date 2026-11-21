import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchIcon } from "@/components/icons";
import { Button } from "./button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

const meta = {
  title: "UI/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput placeholder="Hľadať v katalógu…" aria-label="Hľadať" />
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="ISBN alebo čiarový kód" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="secondary">Skenovať</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const PrefixText: Story = {
  render: () => (
    <InputGroup className="max-w-xs">
      <InputGroupAddon align="inline-start">
        <InputGroupText>SPST-</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Číslo výpožičky" />
    </InputGroup>
  ),
};

export const TextareaBlock: Story = {
  render: () => (
    <InputGroup className="max-w-md">
      <InputGroupAddon align="block-start">
        <InputGroupText className="text-xs text-muted-foreground">Poznámka pre knihovníka</InputGroupText>
      </InputGroupAddon>
      <InputGroupTextarea placeholder="Napr. potrebujem predĺženie…" rows={3} />
      <InputGroupAddon align="block-end" className="justify-end border-t">
        <Button size="sm" type="button">
          Odoslať
        </Button>
      </InputGroupAddon>
    </InputGroup>
  ),
};