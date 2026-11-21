/**
 * Flash toasts that survive full-page redirects (MSAL logoutRedirect).
 * Queue before navigation; ToastFlashListener plays them after mount.
 */

import { isRecord } from "@/lib/api/problem-details";

export type ToastFlashKind =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "library";

export type ToastFlashPayload = {
  kind: ToastFlashKind;
  title: string;
  description?: string;
  iconName?: string;
};

const STORAGE_KEY = "spst.toast.flash";
const KINDS = new Set<ToastFlashKind>([
  "success",
  "error",
  "warning",
  "info",
  "library",
]);

function isToastFlashKind(value: unknown): value is ToastFlashKind {
  return typeof value === "string" && KINDS.has(value as ToastFlashKind);
}

function parseToastFlash(raw: string): ToastFlashPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (!isToastFlashKind(parsed.kind)) return null;
    if (typeof parsed.title !== "string" || !parsed.title.trim()) return null;
    return {
      kind: parsed.kind,
      title: parsed.title.trim(),
      description:
        typeof parsed.description === "string"
          ? parsed.description
          : undefined,
      iconName:
        typeof parsed.iconName === "string" ? parsed.iconName : undefined,
    };
  } catch {
    return null;
  }
}

export function queueToastFlash(payload: ToastFlashPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — ignore
  }
}

export function consumeToastFlash(): ToastFlashPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    return parseToastFlash(raw);
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}
