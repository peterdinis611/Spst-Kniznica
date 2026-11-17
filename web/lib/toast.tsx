import type { ReactNode } from "react";
import { sileo, type SileoOptions, type SileoPosition } from "sileo";
import {
  resolveToastIcon,
  toastIcons,
  type ToastIconName,
} from "@/lib/toast-icons";

export type {
  SileoButton,
  SileoOptions,
  SileoPosition,
  SileoState,
  SileoStyles,
} from "sileo";
export {
  toastIcons,
  toastSvg,
  resolveToastIcon,
} from "@/lib/toast-icons";
export type { ToastIconName } from "@/lib/toast-icons";

export { sileo };

const FILL = {
  ink: "#0e1a24",
  paper: "#f7f3ea",
  sage: "#4d7356",
  clay: "#c97d4a",
  rose: "#b54a4a",
  sky: "#2f5f7a",
} as const;

type ToastInput = Omit<SileoOptions, "title" | "description" | "icon"> & {
  title: string;
  description?: ReactNode | string;
  /** Vlastná SVG / React ikona v badge. `null` skryje ikonu. */
  icon?: ReactNode | null;
  /** Predpripravená animovaná SVG ikona podľa mena. */
  iconName?: ToastIconName;
};

function pickIcon(
  input: ToastInput,
  fallback: ReactNode,
): ReactNode | null | undefined {
  if (input.icon !== undefined) return input.icon;
  if (input.iconName) return resolveToastIcon(input.iconName);
  return fallback;
}

function withDefaults(
  input: ToastInput,
  defaults: Partial<SileoOptions> & { icon: ReactNode },
): SileoOptions {
  const { iconName: _iconName, ...rest } = input;
  return {
    duration: 5600,
    roundness: 16,
    autopilot: { expand: 700, collapse: 2800 },
    ...defaults,
    ...rest,
    icon: pickIcon(input, defaults.icon),
    styles: {
      title: "font-semibold tracking-tight!",
      description: "text-[13px] leading-snug opacity-80!",
      badge: "gap-1.5 px-2.5!",
      button: "font-medium!",
      ...defaults.styles,
      ...input.styles,
    },
  };
}

function success(input: ToastInput) {
  return sileo.success(
    withDefaults(input, {
      fill: FILL.sage,
      icon: toastIcons.success,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/80!",
        badge: "bg-[#0e1a24]/25 text-[#f7f3ea]!",
      },
    }),
  );
}

function error(input: ToastInput) {
  return sileo.error(
    withDefaults(input, {
      fill: FILL.rose,
      duration: 7200,
      icon: toastIcons.error,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/85!",
        badge: "bg-[#0e1a24]/30 text-[#f7f3ea]!",
      },
    }),
  );
}

function warning(input: ToastInput) {
  return sileo.warning(
    withDefaults(input, {
      fill: FILL.clay,
      icon: toastIcons.warning,
      styles: {
        title: "text-[#0e1a24]!",
        description: "text-[#0e1a24]/75!",
        badge: "bg-[#0e1a24]/12 text-[#0e1a24]!",
      },
    }),
  );
}

function info(input: ToastInput) {
  return sileo.info(
    withDefaults(input, {
      fill: FILL.sky,
      icon: toastIcons.info,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/80!",
        badge: "bg-[#0e1a24]/25 text-[#f7f3ea]!",
      },
    }),
  );
}

function library(input: ToastInput) {
  return sileo.show(
    withDefaults(input, {
      fill: FILL.ink,
      icon: toastIcons.library,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/75!",
        badge: "bg-[#4d7356]/35 text-[#d8e8d4]!",
      },
    }),
  );
}

function action(
  input: ToastInput & {
    button: NonNullable<SileoOptions["button"]>;
  },
) {
  return sileo.action(
    withDefaults(input, {
      fill: FILL.ink,
      duration: null,
      icon: toastIcons.action,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/75!",
        badge: "bg-[#4d7356]/40 text-[#d8e8d4]!",
        button: "bg-[#4d7356] text-[#f7f3ea] hover:bg-[#3d5c45]!",
      },
    }),
  );
}

type PromiseMessages<T> = {
  loading: ToastInput;
  success: ToastInput | ((data: T) => ToastInput);
  error: ToastInput | ((err: unknown) => ToastInput);
  position?: SileoPosition;
};

function resolveMessage<T>(
  message: ToastInput | ((value: T) => ToastInput),
  value: T,
): ToastInput {
  return typeof message === "function" ? message(value) : message;
}

function promise<T>(
  work: Promise<T> | (() => Promise<T>),
  messages: PromiseMessages<T>,
) {
  return sileo.promise(work, {
    position: messages.position,
    loading: withDefaults(messages.loading, {
      fill: FILL.ink,
      duration: null,
      icon: toastIcons.loading,
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/70!",
        badge: "bg-white/10 text-[#f7f3ea]!",
      },
    }),
    success: (data) =>
      withDefaults(resolveMessage(messages.success, data), {
        fill: FILL.sage,
        icon: toastIcons.success,
        styles: {
          title: "text-[#f7f3ea]!",
          description: "text-[#f7f3ea]/80!",
          badge: "bg-[#0e1a24]/25 text-[#f7f3ea]!",
        },
      }),
    error: (err) =>
      withDefaults(resolveMessage(messages.error, err), {
        fill: FILL.rose,
        duration: 7200,
        icon: toastIcons.error,
        styles: {
          title: "text-[#f7f3ea]!",
          description: "text-[#f7f3ea]/85!",
          badge: "bg-[#0e1a24]/30 text-[#f7f3ea]!",
        },
      }),
  });
}

/** Doménové skratky s predvolenými SVG ikonami. */
const domain = {
  reserved: (title = "Rezervácia vystavená", description?: string) =>
    success({ title, description, iconName: "book" }),
  renewed: (title = "Termín predĺžený", description?: string) =>
    success({ title, description, iconName: "renew" }),
  cancelled: (title = "Lístok zrušený", description?: string) =>
    info({ title, description, iconName: "cancel" }),
  returned: (title = "Kniha vrátená", description?: string) =>
    success({ title, description, iconName: "checkStack" }),
  favorited: (title = "Pridané medzi obľúbené", description?: string) =>
    library({ title, description, iconName: "heart" }),
  copied: (title = "Skopírované", description?: string) =>
    info({ title, description, iconName: "copy" }),
  scanned: (title = "Kód načítaný", description?: string) =>
    success({ title, description, iconName: "scan" }),
  offline: (title = "Ste offline", description?: string) =>
    warning({ title, description, iconName: "offline" }),
  dueSoon: (title = "Blíži sa termín", description?: string) =>
    warning({ title, description, iconName: "clock" }),
  welcome: (title = "Vitaj v knižnici", description?: string) =>
    library({ title, description, iconName: "spark" }),
} as const;

/** Brandované toast API pre SPST knižnicu (animované SVG ikony v badge). */
export const toast = {
  success,
  error,
  warning,
  info,
  library,
  action,
  promise,
  ...domain,
  dismiss: sileo.dismiss,
  clear: sileo.clear,
  show: sileo.show,
};
