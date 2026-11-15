/** Shared mark for Next.js `icon` / `apple-icon` ImageResponse. */

export const BRAND_ICON = {
  ink: "#0e1a24",
  paper: "#f7f3ea",
  sage: "#4d7356",
  mint: "#d8e8d4",
  accent: "#ff9f1c",
} as const;

type IconMarkProps = {
  size: number;
};

/**
 * Geometric open-book mark + sage spine + brand accent dot.
 * Flex-only layout for `next/og` ImageResponse compatibility.
 */
export function IconMark({ size }: IconMarkProps) {
  const pad = Math.round(size * 0.14);
  const bookW = Math.round(size * 0.58);
  const bookH = Math.round(size * 0.48);
  const spine = Math.max(4, Math.round(size * 0.045));
  const pageGap = Math.max(2, Math.round(size * 0.018));
  const pageW = Math.floor((bookW - spine - pageGap * 2) / 2);
  const accent = Math.max(8, Math.round(size * 0.09));

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_ICON.ink,
        position: "relative",
      }}
    >
      {/* soft sage wash */}
      <div
        style={{
          position: "absolute",
          top: pad,
          right: pad,
          width: Math.round(size * 0.42),
          height: Math.round(size * 0.42),
          borderRadius: "999px",
          background: "rgba(77,115,86,0.28)",
          display: "flex",
        }}
      />

      {/* book body */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          width: bookW,
          height: bookH,
          position: "relative",
        }}
      >
        {/* left page */}
        <div
          style={{
            width: pageW,
            height: bookH,
            background: BRAND_ICON.paper,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: Math.round(size * 0.04),
          }}
        >
          <div
            style={{
              width: "70%",
              height: Math.max(2, Math.round(size * 0.02)),
              background: "rgba(14,26,36,0.18)",
              display: "flex",
              marginBottom: Math.round(size * 0.02),
            }}
          />
          <div
            style={{
              width: "55%",
              height: Math.max(2, Math.round(size * 0.02)),
              background: "rgba(14,26,36,0.12)",
              display: "flex",
            }}
          />
        </div>

        {/* spine */}
        <div
          style={{
            width: spine,
            height: bookH,
            background: BRAND_ICON.sage,
            display: "flex",
            marginLeft: pageGap,
            marginRight: pageGap,
          }}
        />

        {/* right page */}
        <div
          style={{
            width: pageW,
            height: bookH,
            background: BRAND_ICON.mint,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            padding: Math.round(size * 0.04),
          }}
        >
          <div
            style={{
              width: "65%",
              height: Math.max(2, Math.round(size * 0.02)),
              background: "rgba(14,26,36,0.16)",
              display: "flex",
              marginBottom: Math.round(size * 0.02),
            }}
          />
          <div
            style={{
              width: "45%",
              height: Math.max(2, Math.round(size * 0.02)),
              background: "rgba(14,26,36,0.1)",
              display: "flex",
            }}
          />
        </div>
      </div>

      {/* brand period */}
      <div
        style={{
          position: "absolute",
          right: pad,
          bottom: pad,
          width: accent,
          height: accent,
          borderRadius: "999px",
          background: BRAND_ICON.accent,
          display: "flex",
        }}
      />
    </div>
  );
}
