"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toggleClassName =
  "size-10 rounded-full border-rule bg-paper-deep text-ink " +
  "hover:border-accent hover:bg-accent hover:text-accent-foreground " +
  "dark:border-white/25 dark:bg-transparent dark:text-white " +
  "dark:hover:border-accent dark:hover:bg-accent dark:hover:text-accent-foreground";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className={cn(
          toggleClassName,
          "inline-flex items-center justify-center border opacity-60",
          className,
        )}
        aria-hidden
      >
        <Moon className="size-4" strokeWidth={1.8} />
      </span>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-tour="theme"
      className={cn(toggleClassName, className)}
      aria-label={isDark ? "Zapnúť light mode" : "Zapnúť dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.8} />
      ) : (
        <Moon className="size-4" strokeWidth={1.8} />
      )}
    </Button>
  );
}
