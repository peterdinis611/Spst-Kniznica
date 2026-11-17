import type { ReactNode, SVGProps } from "react";

type SvgProps = SVGProps<SVGSVGElement>;

function IconShell({
  children,
  className,
  ...props
}: SvgProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={["toast-icon", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Inline SVG helper do Sileo badge. */
export function toastSvg(
  children: ReactNode,
  { className, ...props }: SvgProps = {},
) {
  return (
    <IconShell className={className} {...props}>
      {children}
    </IconShell>
  );
}

export const toastIcons = {
  success: (
    <IconShell>
      <circle
        className="toast-icon__ring"
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle
        className="toast-icon__draw-long"
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      <path
        className="toast-icon__draw"
        d="M5.15 8.2 7.1 10.1l3.85-4.35"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  error: (
    <IconShell>
      <circle
        className="toast-icon__wiggle"
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      <path
        className="toast-icon__draw"
        d="m5.55 5.55 4.9 4.9M10.45 5.55l-4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  warning: (
    <IconShell>
      <path
        className="toast-icon__bounce"
        d="M8 2.35 13.85 12.7H2.15L8 2.35Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.15v3.15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.2" r="0.85" fill="currentColor" />
    </IconShell>
  ),

  info: (
    <IconShell>
      <circle
        className="toast-icon__draw-long"
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      <path
        d="M8 7.15v4.05"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
    </IconShell>
  ),

  library: (
    <IconShell>
      <g className="toast-icon__bounce">
        <path
          d="M3.15 3h3.45c.95 0 1.75.72 1.75 1.65v8.2c0-.82-.72-1.45-1.55-1.45H3.15V3Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M12.85 3H9.4c-.95 0-1.75.72-1.75 1.65v8.2c0-.82.72-1.45 1.55-1.45h3.65V3Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M8 4.55v8.35"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </g>
    </IconShell>
  ),

  action: (
    <IconShell>
      <path
        className="toast-icon__bounce"
        d="m8 2.15 1.1 3.25H12.7L9.95 7.45l1.1 3.3L8 8.6 5 10.75l1.1-3.3L3.3 5.4h3.6L8 2.15Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  loading: (
    <IconShell>
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.7"
      />
      <path
        className="toast-icon__spin"
        d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  bookmark: (
    <IconShell>
      <path
        className="toast-icon__bounce"
        d="M4.2 2.4h7.6v11.1L8 11.15 4.2 13.5V2.4Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  scan: (
    <IconShell>
      <path
        d="M3 5.15V3.75A.75.75 0 0 1 3.75 3H5.15M10.85 3h1.4a.75.75 0 0 1 .75.75v1.4M13 10.85v1.4a.75.75 0 0 1-.75.75h-1.4M5.15 13H3.75a.75.75 0 0 1-.75-.75v-1.4"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        className="toast-icon__scan-line"
        d="M3.4 8h9.2"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  book: (
    <IconShell>
      <path
        className="toast-icon__draw-long"
        d="M3.2 3.2h4.1c.9 0 1.6.7 1.6 1.55V13c-.7-.55-1.5-.85-2.4-.85H3.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 3.2H8.7c-.9 0-1.6.7-1.6 1.55V13c.7-.55 1.5-.85 2.4-.85h3.3V3.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  renew: (
    <IconShell>
      <g className="toast-icon__bounce">
        <path
          d="M12.6 6.2A4.7 4.7 0 1 0 13 8.4"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
        <path
          d="M12.2 3.4v3.1h-3"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </IconShell>
  ),

  cancel: (
    <IconShell>
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        className="toast-icon__draw"
        d="M5.4 8h5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  copy: (
    <IconShell>
      <rect
        className="toast-icon__bounce"
        x="5.2"
        y="5.2"
        width="7.2"
        height="7.2"
        rx="1.1"
        stroke="currentColor"
        strokeWidth="1.45"
      />
      <path
        d="M3.6 10.2V4.5A1.1 1.1 0 0 1 4.7 3.4h5.7"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  shelf: (
    <IconShell>
      <path
        className="toast-icon__draw-long"
        d="M2.6 4.2h10.8M2.6 8h10.8M2.6 11.8h10.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.2 4.2V11.8M8 4.2v7.6M11.8 4.2v7.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
    </IconShell>
  ),

  user: (
    <IconShell>
      <circle
        className="toast-icon__bounce"
        cx="8"
        cy="5.4"
        r="2.35"
        stroke="currentColor"
        strokeWidth="1.45"
      />
      <path
        d="M3.4 13c.7-2.35 2.2-3.5 4.6-3.5s3.9 1.15 4.6 3.5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  offline: (
    <IconShell>
      <path
        className="toast-icon__pulse"
        d="M3.1 7.2a7 7 0 0 1 9.8 0M5 9.2a4.4 4.4 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="0.95" fill="currentColor" />
      <path
        d="m3.2 3.2 9.6 9.6"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </IconShell>
  ),

  clock: (
    <IconShell>
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        className="toast-icon__draw"
        d="M8 4.6V8l2.4 1.7"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  heart: (
    <IconShell>
      <path
        className="toast-icon__pulse"
        d="M8 13.1s-5.2-3.15-5.2-6.35A2.85 2.85 0 0 1 8 5.15a2.85 2.85 0 0 1 5.2 1.6C13.2 9.95 8 13.1 8 13.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  checkStack: (
    <IconShell>
      <path
        d="M3.2 4.4h7.2M3.2 7.4h5.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <path
        className="toast-icon__draw"
        d="M5.1 11.1 6.7 12.6l4.2-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconShell>
  ),

  spark: (
    <IconShell>
      <path
        className="toast-icon__bounce"
        d="M8 2.2v2.4M8 11.4v2.4M2.2 8h2.4M11.4 8h2.4M4.05 4.05l1.7 1.7M10.25 10.25l1.7 1.7M11.95 4.05l-1.7 1.7M5.75 10.25l-1.7 1.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="1.35" fill="currentColor" />
    </IconShell>
  ),
} as const;

export type ToastIconName = keyof typeof toastIcons;

export function resolveToastIcon(
  name?: ToastIconName | null,
): ReactNode | undefined {
  if (!name) return undefined;
  return toastIcons[name];
}
