"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sileo";
import "sileo/styles.css";
import "@/components/toast/sileo-toast.css";
import { ToastFlashListener } from "@/components/toast/ToastFlashListener";

export function SileoToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme =
    resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : "system";

  // Avoid rendering Toaster during SSR / first paint — sileo+motion need a mounted tree.
  if (!mounted) return null;

  return (
    <>
      <Toaster
        position="top-right"
        theme={theme}
        offset={{ top: 18, right: 18, bottom: 18, left: 18 }}
        options={{
          roundness: 18,
          duration: 6200,
          autopilot: { expand: 420, collapse: 3400 },
          styles: {
            title: "font-semibold tracking-tight!",
            description: "text-[13px] leading-snug opacity-80!",
            badge: "gap-1.5!",
            button: "font-medium!",
          },
        }}
      />
      <ToastFlashListener />
    </>
  );
}
