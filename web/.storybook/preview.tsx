import type { Preview, Decorator } from "@storybook/nextjs-vite";
import { Fraunces, Sora, IBM_Plex_Mono } from "next/font/google";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import "../app/globals.css";

const display = Fraunces({
  variable: "--font-display-family",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Sora({
  variable: "--font-body-family",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const withProviders: Decorator = (Story, context) => {
  const theme =
    (context.globals.theme as "light" | "dark" | "system") ?? "light";

  return (
    <div
      className={cn(
        "min-h-screen antialiased",
        display.variable,
        body.variable,
        mono.variable,
      )}
    >
      <NuqsTestingAdapter>
        <ThemeProvider
          key={theme}
          attribute="class"
          defaultTheme={theme}
          forcedTheme={theme === "system" ? undefined : theme}
          enableSystem={theme === "system"}
          disableTransitionOnChange
        >
          <div className="bg-paper p-8 text-ink">
            <Story />
          </div>
        </ThemeProvider>
      </NuqsTestingAdapter>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
    backgrounds: { disable: true },
    nextjs: {
      appDirectory: true,
    },
  },
  globalTypes: {
    theme: {
      description: "Light / dark surface",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "browser" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withProviders],
};

export default preview;
