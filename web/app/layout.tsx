import type { Metadata, Viewport } from "next";
import { Fraunces, Sora, IBM_Plex_Mono } from "next/font/google";
import { AbilityProvider } from "@/components/auth/AbilityProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ServerStatusBanner } from "@/components/server-status-banner";
import { ScrollToTopLazy } from "@/components/scroll-to-top-lazy";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
  alternates: {
    canonical: "/",
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


  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Library",
  name: siteConfig.name,
  description: siteConfig.description,
  url: absoluteUrl("/"),
  inLanguage: siteConfig.language,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
