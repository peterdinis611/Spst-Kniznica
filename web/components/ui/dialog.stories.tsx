import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTrigger: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Rezervovať knihu</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezervácia</DialogTitle>
          <DialogDescription>
            Kniha bude pripravená na vyzdvihnutie do 24 hodín na informačnom pulte.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Zrušiť</Button>
          <Button>Potvrdiť rezerváciu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Predĺžiť výpožičku?</DialogTitle>
          <DialogDescription>
            Termín vrátenia sa posunie o 14 dní. Predĺženie je možné len raz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Nie</Button>
          <Button>Áno, predĺžiť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DestructiveConfirm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>
        Zrušiť rezerváciu
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zrušiť rezerváciu?</DialogTitle>
          <DialogDescription>
            Rezervácia pre &quot;Malý princ&quot; bude zrušená. Túto akciu nemožno vrátiť späť.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Ponechať</Button>
          <Button variant="destructive">Zrušiť rezerváciu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};