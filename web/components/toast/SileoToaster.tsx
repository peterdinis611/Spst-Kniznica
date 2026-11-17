"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sileo";
import "sileo/styles.css";
import "@/components/toast/sileo-toast.css";

export function SileoToaster() {
  const { resolvedTheme } = useTheme();
  const theme =
    resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : "system";

  return (
    <Toaster
      position="top-right"
      theme={theme}
      offset={{ top: 18, right: 18, bottom: 18, left: 18 }}
      options={{
        roundness: 16,
        duration: 5600,
        autopilot: { expand: 700, collapse: 2800 },
        styles: {
          title: "font-semibold tracking-tight!",
          description: "text-[13px] leading-snug opacity-80!",
          badge: "gap-1.5!",
          button: "font-medium!",
        },
      }}
    />
  );
}
