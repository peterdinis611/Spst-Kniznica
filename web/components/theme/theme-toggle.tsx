"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className ?? "size-10 rounded-full border-ink"}
      aria-label={isDark ? "Zapnúť light mode" : "Zapnúť dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.8} />
      ) : (
        <Moon className="size-4" strokeWidth={1.8} />
      )}
    </Button>
  );
}
