import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTrigger: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Dostupnosť
      </TooltipTrigger>
      <TooltipContent>Na sklade 3 kusy — môžete si požičať ihneď.</TooltipContent>
    </Tooltip>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger render={<Button variant="ghost" size="sm" />}>
        Termín vrátenia
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Vrátiť do 12. 12. 2026, inak pokuta 0,20 € / deň.
      </TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger render={<Button size="sm" variant="outline" />}>
            {side}
          </TooltipTrigger>
          <TooltipContent side={side}>Pozícia: {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};