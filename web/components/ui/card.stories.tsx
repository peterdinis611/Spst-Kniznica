import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookTile: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>1984</CardTitle>
        <CardDescription>George Orwell · Beletria</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Detail
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Na sklade: 3 kusy · ISBN 978-80-554-2901-5</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">
          Rezervovať
        </Button>
        <Button className="flex-1">Požičať</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" className="max-w-xs">
      <CardHeader>
        <CardTitle className="text-sm">Predĺženie výpožičky</CardTitle>
        <CardDescription>Termín vrátenia: 12. 12. 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Knihu môžete predĺžiť ešte 1×.</p>
      </CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardContent className="pt-(--card-spacing)">
        <p>
          Knižnica SPST — otvorené pondelok až piatok 8:00–16:00. Vrátenie kníh na
          informačnom pulte.
        </p>
      </CardContent>
    </Card>
  ),
};