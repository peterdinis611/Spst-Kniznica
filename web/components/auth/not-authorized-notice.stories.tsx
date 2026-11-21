import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ForbiddenNotice,
  SignInRequiredNotice,
} from "./NotAuthorizedNotice";

const signInCopy = {
  eyebrow: "Prístup obmedzený",
  title: "Potrebné prihlásenie",
  description:
    "Táto časť katalógu je dostupná len po prihlásení školským účtom. Bez identity nevieme overiť výpožičný lístok.",
  hint: "Použi položku „Prihlásiť“ v hornej lište.",
} as const;

const forbiddenCopy = {
  eyebrow: "403 · bez oprávnenia",
  title: "Nemáš prístup",
  description:
    "Účet je prihlásený, ale na túto sekciu nemáš oprávnenie. Ak ide o chybu, obráť sa na správcu knižnice.",
  hint: "Skús inú časť knižnice alebo kontaktuj podporu.",
} as const;

const meta = {
  title: "Auth/NotAuthorizedNotice",
  component: SignInRequiredNotice,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SignInRequiredNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInRequiredPage: Story = {
  name: "SignInRequired · stránka",
  args: {
    ...signInCopy,
    variant: "page",
  },
};

export const SignInRequiredCompact: Story = {
  name: "SignInRequired · kompaktné",
  args: {
    ...signInCopy,
    variant: "compact",
  },
};

export const ForbiddenPage: Story = {
  name: "Forbidden · stránka",
  args: {
    ...forbiddenCopy,
    variant: "page",
  },
  render: (args) => <ForbiddenNotice {...args} />,
};

export const ForbiddenCompact: Story = {
  name: "Forbidden · kompaktné",
  args: {
    ...forbiddenCopy,
    variant: "compact",
  },
  render: (args) => <ForbiddenNotice {...args} />,
};