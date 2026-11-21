import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";

const titles = [
  "1984",
  "Malý princ",
  "Krtko",
  "Programovanie v C#",
  "Fyzika 1",
  "Dejiny Slovenska",
  "Maťa",
  "Lesná samota",
  "Slovník cudzích slov",
  "Matematika pre gymnázium",
  "Anglická gramatika",
  "Chemická rovnica",
];

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookList: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-lg border p-3">
      <ul className="space-y-0">
        {titles.map((title, index) => (
          <li key={title}>
            <div className="py-2 text-sm">{title}</div>
            {index < titles.length - 1 ? <Separator /> : null}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};

export const HorizontalTags: Story = {
  render: () => (
    <ScrollArea className="w-80 whitespace-nowrap rounded-lg border p-3">
      <div className="flex w-max gap-2">
        {["Beletria", "Učebnice", "Sci-fi", "Biografia", "Deti", "Poézia", "História"].map(
          (tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border px-3 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ),
        )}
      </div>
    </ScrollArea>
  ),
};