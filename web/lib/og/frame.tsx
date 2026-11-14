import { ogFontFamily, ogTheme } from "./theme";

export type OgBadge = {
  label: string;
  tone?: "ok" | "warn" | "neutral";
};

export type OgFrameProps = {
  variant?: "list" | "entity";
  eyebrow: string;
  title: string;
  description: string;
  /** Secondary line under the title (author · year, nationality, …). */
  meta?: string;
  badge?: OgBadge;
  /** Override left accent stripe / dots (e.g. category color). */
  accentColor?: string;
  footerLeft?: string;
  footerRight?: string;
};

function badgeColor(tone: OgBadge["tone"]) {
  if (tone === "warn") return ogTheme.warn;
  if (tone === "ok") return ogTheme.ok;
  return ogTheme.paperMuted;
}

/** JSX for `ImageResponse` — every multi-child node uses `display: flex`. */
export function OgFrame({
  variant = "list",
  eyebrow,
  title,
  description,
  meta,
  badge,
  accentColor,
  footerLeft = "spst-kniznica",
  footerRight = "katalog · autori · vypozicky",
}: OgFrameProps) {
  const accent = accentColor || ogTheme.accent;
  const isEntity = variant === "entity";
  const titleSize = isEntity ? 64 : 88;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: ogTheme.ink,
        color: ogTheme.paper,
        fontFamily: ogFontFamily.body,
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
          background: accent,
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
          fontFamily: ogFontFamily.display,
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
          padding: isEntity ? "56px 72px 52px 88px" : "64px 72px 56px 88px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                background: accent,
              }}
            />
            <div
              style={{
                display: "flex",
                fontFamily: ogFontFamily.mono,
                fontSize: 22,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: accent,
              }}
            >
              {eyebrow}
            </div>
          </div>

          {badge ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: `1px solid ${badgeColor(badge.tone)}`,
                padding: "10px 16px",
                fontFamily: ogFontFamily.mono,
                fontSize: 18,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: badgeColor(badge.tone),
              }}
            >
              {badge.label}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isEntity ? 16 : 22,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 8,
              fontFamily: ogFontFamily.display,
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
            }}
          >
            <span style={{ display: "flex" }}>{title}</span>
            <span style={{ display: "flex", color: accent }}>.</span>
          </div>

          {meta ? (
            <div
              style={{
                display: "flex",
                fontFamily: ogFontFamily.mono,
                fontSize: 22,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: ogTheme.paperMuted,
              }}
            >
              {meta}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              width: 96,
              height: 4,
              background: accent,
            }}
          />

          <div
            style={{
              display: "flex",
              maxWidth: 780,
              fontSize: isEntity ? 26 : 28,
              fontWeight: 400,
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
            fontFamily: ogFontFamily.mono,
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
