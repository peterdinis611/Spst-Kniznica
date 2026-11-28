import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

const colors = {
  ink: "#1a2418",
  paper: "#f3efe6",
  panel: "#fffdf8",
  forest: "#2f4f3a",
  accent: "#c45c26",
  mute: "#5c6758",
  rule: "#d4cbb8",
};

type SpstEmailLayoutProps = {
  preview: string;
  children: ReactNode;
  catalogUrl?: string;
  myLibraryUrl?: string;
};

/** Editorial school-library chrome — web-safe type, no scripts. */
export function SpstEmailLayout({
  preview,
  children,
  catalogUrl = "{{CatalogUrl}}",
  myLibraryUrl = "{{MyLibraryUrl}}",
}: SpstEmailLayoutProps) {
  return (
    <Html lang="sk">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={shell}>
          <Section style={masthead}>
            <Text style={brand}>SPST Knižnica</Text>
            <Text style={tagline}>Školský katalóg · Bardejov</Text>
          </Section>
          <Section style={panel}>{children}</Section>
          <Hr style={hr} />
          <Section>
            <Text style={footer}>
              <Link href={catalogUrl} style={footerLink}>
                Katalóg
              </Link>
              {" · "}
              <Link href={myLibraryUrl} style={footerLink}>
                Moja knižnica
              </Link>
            </Text>
            <Text style={footerMute}>
              Stredná priemyselná škola technická, Komenského 5, Bardejov
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: CSSProperties = {
  backgroundColor: colors.paper,
  fontFamily:
    'Georgia, "Times New Roman", Times, serif',
  margin: 0,
  padding: "32px 12px",
  color: colors.ink,
};

const shell: CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
};

const masthead: CSSProperties = {
  padding: "8px 4px 20px",
};

const brand: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: "1.15",
  letterSpacing: "-0.02em",
  color: colors.forest,
  fontWeight: 700,
};

const tagline: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.mute,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const panel: CSSProperties = {
  backgroundColor: colors.panel,
  border: `1px solid ${colors.rule}`,
  borderLeft: `4px solid ${colors.accent}`,
  padding: "28px 24px",
};

const hr: CSSProperties = {
  borderColor: colors.rule,
  borderTop: `1px solid ${colors.rule}`,
  margin: "24px 0 16px",
};

const footer: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  color: colors.mute,
};

const footerLink: CSSProperties = {
  color: colors.forest,
  textDecoration: "underline",
};

const footerMute: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "12px",
  color: colors.mute,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

export const emailStyles = {
  colors,
  greeting: {
    margin: "0 0 16px",
    fontSize: "16px",
    lineHeight: "1.5",
  } satisfies CSSProperties,
  title: {
    margin: "0 0 12px",
    fontSize: "22px",
    lineHeight: "1.25",
    color: colors.ink,
    fontWeight: 700,
  } satisfies CSSProperties,
  body: {
    margin: "0 0 12px",
    fontSize: "15px",
    lineHeight: "1.55",
    color: colors.ink,
  } satisfies CSSProperties,
  meta: {
    margin: "16px 0 0",
    padding: "12px 14px",
    backgroundColor: "#f0ebe0",
    border: `1px solid ${colors.rule}`,
    fontSize: "14px",
    lineHeight: "1.5",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  } satisfies CSSProperties,
  metaLabel: {
    color: colors.mute,
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    margin: "0 0 2px",
  } satisfies CSSProperties,
  metaValue: {
    margin: "0 0 10px",
    color: colors.ink,
    fontWeight: 600,
  } satisfies CSSProperties,
  cta: {
    display: "inline-block",
    marginTop: "20px",
    backgroundColor: colors.forest,
    color: "#f7f3ea",
    padding: "12px 18px",
    textDecoration: "none",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: "14px",
    fontWeight: 600,
  } satisfies CSSProperties,
};
