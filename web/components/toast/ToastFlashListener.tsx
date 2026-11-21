"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { consumeToastFlash } from "@/lib/toast-flash";
import type { ToastIconName } from "@/lib/toast-icons";

/** Plays flash toasts queued before a full-page redirect (e.g. MSAL logout). */
export function ToastFlashListener() {
  useEffect(() => {
    const flash = consumeToastFlash();
    if (!flash) return;

    const input = {
      title: flash.title,
      description: flash.description,
      iconName: flash.iconName as ToastIconName | undefined,
    };

    // Let Toaster paint one frame before enqueueing — cleaner enter motion.
    const id = window.setTimeout(() => {
      switch (flash.kind) {
        case "success":
          toast.success(input);
          break;
        case "error":
          toast.error(input);
          break;
        case "warning":
          toast.warning(input);
          break;
        case "library":
          toast.library(input);
          break;
        default:
          toast.info(input);
          break;
      }
    }, 80);

    return () => window.clearTimeout(id);
  }, []);

  return null;
}
