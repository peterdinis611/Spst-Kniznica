import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sampleAuthors } from "@/.storybook/fixtures";
import { AuthorAuthorityLinks } from "./AuthorAuthorityLinks";

const orwell = sampleAuthors[0]!;

const meta = {
  title: "Catalog/AuthorAuthorityLinks",
  component: AuthorAuthorityLinks,
  tags: ["autodocs"],
  args: {
    profileUrl: orwell.profileUrl,
    wikidataId: orwell.wikidataId,
    viafId: orwell.viafId,
  },
} satisfies Meta<typeof AuthorAuthorityLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VsetkyLinky: Story = {};

export const IbaProfil: Story = {
  args: {
    profileUrl: orwell.profileUrl,
    wikidataId: null,
    viafId: null,
  },
};

export const Prazdne: Story = {
  args: {
    profileUrl: null,
    wikidataId: null,
    viafId: null,
  },
};