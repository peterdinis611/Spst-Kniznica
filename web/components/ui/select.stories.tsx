import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Genre: Story = {
  render: () => (
    <Select defaultValue="beletria">
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Vyberte žáner" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Žánre</SelectLabel>
          <SelectItem value="beletria">Beletria</SelectItem>
          <SelectItem value="naucna">Náučná literatúra</SelectItem>
          <SelectItem value="ucebnice">Učebnice</SelectItem>
          <SelectItem value="sci-fi">Sci-fi a fantasy</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithTrigger: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Jazyk vydania" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sk">Slovenčina</SelectItem>
        <SelectItem value="en">Angličtina</SelectItem>
        <SelectItem value="de">Nemčina</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select defaultValue="dostupne">
      <SelectTrigger size="sm" className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dostupne">Dostupné</SelectItem>
        <SelectItem value="vsetky">Všetky</SelectItem>
        <SelectItem value="rezervovane">Len rezervované</SelectItem>
      </SelectContent>
    </Select>
  ),
};