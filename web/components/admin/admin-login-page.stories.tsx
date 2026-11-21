import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { fn } from "storybook/test";
import { AdminLoginPage } from "./AdminLoginPage";

/**
 * Blokuje `location.assign` skôr než `AdminLoginPage` stihne presmerovať —
 * layout effect v rodičovi beží pred child `useEffect`.
 */
function BlockLocationAssign({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const assignMock = fn();
    const locationProto = Object.getPrototypeOf(window.location) as Location;
    const original = locationProto.assign;

    try {
      locationProto.assign = assignMock as Location["assign"];
    } catch {
      // ignore — záložný mock priamo na inštancii
      try {
        window.location.assign = assignMock as typeof window.location.assign;
      } catch {
        // noop
      }
    }

    return () => {
      try {
        locationProto.assign = original;
      } catch {
        // noop
      }
    };
  }, []);

  return children;
}

const blockRedirect: Decorator = (Story) => (
  <BlockLocationAssign>
    <Story />
  </BlockLocationAssign>
);

const meta = {
  title: "Admin/AdminLoginPage",
  component: AdminLoginPage,
  tags: ["autodocs"],
  decorators: [blockRedirect],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Presmeruje na `/login?next=/admin`. V Storybooki je `location.assign` zablokovaný, aby zostala viditeľná správa „Presmerovávam…“.",
      },
    },
  },
} satisfies Meta<typeof AdminLoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};