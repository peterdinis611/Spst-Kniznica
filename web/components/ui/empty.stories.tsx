import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen } from "@/components/icons";
import { Button } from "./button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

const meta = {
  title: "UI/Empty",
  component: Empty,
  tags: ["autodocs"],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoResults: Story = {
  render: () => (
    <Empty className="max-w-md border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookOpen className="size-4" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>Žiadne výsledky</EmptyTitle>
        <EmptyDescription>
          Skúste iný výraz alebo zrušte filtre v katalógu kníh.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Vymazať filtre
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

export const EmptyLoans: Story = {
  render: () => (
    <Empty className="min-h-48 max-w-lg border">
      <EmptyHeader>
        <EmptyTitle>Žiadne aktívne výpožičky</EmptyTitle>
        <EmptyDescription>
          Keď si požičiate knihu, zobrazí sa tu termín vrátenia a možnosť predĺženia.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Prehľadať katalóg</Button>
      </EmptyContent>
    </Empty>
  ),
};