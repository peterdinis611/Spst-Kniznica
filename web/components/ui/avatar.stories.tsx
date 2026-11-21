import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckIcon } from "@/components/icons";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop"
        alt="Peter Novák"
      />
      <AvatarFallback>PN</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/neexistuje.jpg" alt="" />
      <AvatarFallback>MČ</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>LK</AvatarFallback>
        <AvatarBadge>
          <CheckIcon className="size-2" aria-hidden />
        </AvatarBadge>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
};