"use client";

import { useEffect } from "react";
import { useTheme as useRaTheme } from "react-admin";
import { useTheme as useNextTheme } from "next-themes";

/** Keep react-admin light/dark in sync with next-themes (`.dark` on <html>). */
export function AdminThemeSync() {
  const [raTheme] = useRaTheme();
  const { setTheme } = useNextTheme();

  useEffect(() => {
    if (raTheme === "dark" || raTheme === "light") {
      setTheme(raTheme);
    }
  }, [raTheme, setTheme]);

  return null;
}
