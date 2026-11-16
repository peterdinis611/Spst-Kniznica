"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sileo";
import "sileo/styles.css";

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
        roundness: 14,
        duration: 5200,
        autopilot: { expand: 900, collapse: 3200 },
      }}
    />
  );
}
