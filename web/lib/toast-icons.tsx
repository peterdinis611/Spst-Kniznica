import type { ReactNode, SVGProps } from "react";

type SvgProps = SVGProps<SVGSVGElement> & {
  spin?: boolean;
};

function svgClass(spin?: boolean) {
  return spin ? "size-3.5 shrink-0 animate-spin" : "size-3.5 shrink-0";
}

/** Inline SVG ikona do Sileo badge (14×14). */
export function toastSvg(
  children: ReactNode,
  { spin, className, ...props }: SvgProps = {},
) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={[svgClass(spin), className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </svg>
  );
}

export const toastIcons = {
  success: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.2 8.15 7.05 10l3.75-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  error: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m5.6 5.6 4.8 4.8M10.4 5.6l-4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),

  warning: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <path
        d="M8 2.4 13.7 12.6H2.3L8 2.4Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.2v3.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.15" r="0.85" fill="currentColor" />
    </svg>
  ),

  info: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 7.2v4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.15" r="0.9" fill="currentColor" />
    </svg>
  ),

  library: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <path
        d="M3.2 3.1h3.4c.9 0 1.7.7 1.7 1.6v8.1c0-.8-.7-1.4-1.5-1.4H3.2V3.1Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 3.1H9.4c-.9 0-1.7.7-1.7 1.6v8.1c0-.8.7-1.4 1.5-1.4h3.6V3.1Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M8 4.6v8.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  ),

  action: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <path
        d="m8 2.2 1.05 3.2H12.6L9.9 7.4l1.05 3.25L8 8.55 5.05 10.65 6.1 7.4 3.4 5.4h3.55L8 2.2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  ),

  loading: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0 animate-spin"
    >
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.7"
      />
      <path
        d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),

  bookmark: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <path
        d="M4.2 2.5h7.6v11L8 11.2 4.2 13.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),

  scan: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-3.5 shrink-0"
    >
      <path
        d="M3 5.2V3.8A.8.8 0 0 1 3.8 3H5.2M11 3h1.2a.8.8 0 0 1 .8.8V5.2M13 11v1.2a.8.8 0 0 1-.8.8H11M5.2 13H3.8a.8.8 0 0 1-.8-.8V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  ),
} as const;

export type ToastIconName = keyof typeof toastIcons;
