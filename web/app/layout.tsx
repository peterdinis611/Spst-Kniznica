import type { Metadata } from "next";
import { Fraunces, Sora, IBM_Plex_Mono } from "next/font/google";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-family",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const body = Sora({
  variable: "--font-body-family",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "SPST Knižnica",
    template: "%s · SPST Knižnica",
  },
  description:
    "Katalóg, autori a výpožičný pult strednej priemyselnej školy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
