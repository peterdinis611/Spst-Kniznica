import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  Info,
  LoaderCircle,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { createElement, type ReactNode } from "react";
import { sileo, type SileoOptions, type SileoPosition } from "sileo";

export type {
  SileoButton,
  SileoOptions,
  SileoPosition,
  SileoState,
  SileoStyles,
} from "sileo";

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
  icon?: ReactNode | null;
};

function badgeIcon(Icon: LucideIcon, spin = false): ReactNode {
  return createElement(Icon, {
    className: spin ? "size-3.5 animate-spin" : "size-3.5",
    strokeWidth: 2.4,
    "aria-hidden": true,
  });
}

function withDefaults(
  input: ToastInput,
  defaults: Partial<SileoOptions> & { icon: ReactNode },
): SileoOptions {
  return {
    duration: 5200,
    roundness: 14,
    autopilot: { expand: 900, collapse: 3200 },
    ...defaults,
    ...input,
    icon: input.icon === undefined ? defaults.icon : input.icon,
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
      icon: badgeIcon(CheckCircle2),
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
      duration: 7000,
      icon: badgeIcon(XCircle),
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
      icon: badgeIcon(AlertTriangle),
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
      icon: badgeIcon(Info),
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
      icon: badgeIcon(BookMarked),
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
      icon: badgeIcon(Sparkles),
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
      icon: badgeIcon(LoaderCircle, true),
      styles: {
        title: "text-[#f7f3ea]!",
        description: "text-[#f7f3ea]/70!",
        badge: "bg-white/10 text-[#f7f3ea]!",
      },
    }),
    success: (data) =>
      withDefaults(resolveMessage(messages.success, data), {
        fill: FILL.sage,
        icon: badgeIcon(CheckCircle2),
        styles: {
          title: "text-[#f7f3ea]!",
          description: "text-[#f7f3ea]/80!",
          badge: "bg-[#0e1a24]/25 text-[#f7f3ea]!",
        },
      }),
    error: (err) =>
      withDefaults(resolveMessage(messages.error, err), {
        fill: FILL.rose,
        duration: 7000,
        icon: badgeIcon(XCircle),
        styles: {
          title: "text-[#f7f3ea]!",
          description: "text-[#f7f3ea]/85!",
          badge: "bg-[#0e1a24]/30 text-[#f7f3ea]!",
        },
      }),
  });
}

/** Brandované toast API pre SPST knižnicu. */
export const toast = {
  success,
  error,
  warning,
  info,
  library,
  action,
  promise,
  dismiss: sileo.dismiss,
  clear: sileo.clear,
  show: sileo.show,
};
