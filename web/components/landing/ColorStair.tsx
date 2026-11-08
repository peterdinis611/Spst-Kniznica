export function ColorStair() {
  return (
    <div aria-hidden className="relative z-10 w-full overflow-hidden">
      <svg
        viewBox="0 0 1440 96"
        className="block h-16 w-full sm:h-20 md:h-24"
        preserveAspectRatio="none"
        role="presentation"
      >
        <path fill="#ffffff" d="M0 0h288v96H0z" />
        <path fill="#ff9f1c" d="M288 24h288v72H288z" />
        <path fill="#ff5c33" d="M576 40h288v56H576z" />
        <path fill="#e91e63" d="M864 56h288v40H864z" />
        <path fill="#9c27b0" d="M1152 72h288v24H1152z" />
      </svg>
    </div>
  );
}
