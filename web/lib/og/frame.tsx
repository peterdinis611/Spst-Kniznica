import { ogTheme } from "./theme";

type OgFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  footerLeft?: string;
  footerRight?: string;
};

/** JSX for `ImageResponse` — every multi-child node uses `display: flex`. */
export function OgFrame({
  eyebrow,
  title,
  description,
  footerLeft = "spst-kniznica",
  footerRight = "katalog · autori · vypozicky",
}: OgFrameProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: ogTheme.ink,
        color: ogTheme.paper,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 28,
          height: "100%",
          display: "flex",
          background: ogTheme.accent,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.07,
          backgroundImage:
            "linear-gradient(to right, rgba(247,243,234,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(247,243,234,0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 48,
          top: 36,
          display: "flex",
          fontSize: 220,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          color: "rgba(247,243,234,0.06)",
          lineHeight: 1,
        }}
      >
        S
      </div>

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 56px 88px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              background: ogTheme.accent,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: ogTheme.accent,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 8,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
            }}
          >
            <span style={{ display: "flex" }}>{title}</span>
            <span style={{ display: "flex", color: ogTheme.accent }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 4,
              background: ogTheme.accent,
            }}
          />
          <div
            style={{
              display: "flex",
              maxWidth: 780,
              fontSize: 28,
              lineHeight: 1.35,
              color: ogTheme.paperMuted,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${ogTheme.ruleStrong}`,
            paddingTop: 22,
            fontSize: 18,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: ogTheme.paperMuted,
          }}
        >
          <div style={{ display: "flex" }}>{footerLeft}</div>
          <div style={{ display: "flex" }}>{footerRight}</div>
        </div>
      </div>
    </div>
  );
}
