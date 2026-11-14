import type { Metadata, Viewport } from "next";
import { Fraunces, Sora, IBM_Plex_Mono } from "next/font/google";
import { AbilityProvider } from "@/components/auth/AbilityProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServerStatusBanner } from "@/components/server-status-banner";
import { ScrollToTopLazy } from "@/components/scroll-to-top-lazy";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { libraryJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-family",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: true,
});

const body = Sora({
  variable: "--font-body-family",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "education",
  classification: "Library Catalog",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
    languages: {
      sk: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "geo.region": "SK",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1a24" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.language}
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        display.variable,
        body.variable,
        mono.variable,
      )}
    >
      <body
        className="flex min-h-full flex-col overflow-x-hidden bg-paper text-ink"
        suppressHydrationWarning
      >
        <JsonLd data={[libraryJsonLd(), websiteJsonLd()]} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AbilityProvider>
              <ServerStatusBanner />
              {children}

              <ScrollToTopLazy />
            </AbilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
