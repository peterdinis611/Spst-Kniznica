import { bwDarkTheme, bwLightTheme } from "react-admin";
import { deepmerge } from "@mui/utils";
import type { RaThemeOptions } from "react-admin";

/**
 * shadcn B&W base + SPST library desk tokens.
 * Light = paper/ink/sage. Dark = ink navy with sage signal, not flat black.
 */

const fonts = {
  body: 'var(--font-body-family), Sora, ui-sans-serif, system-ui, sans-serif',
  display:
    'var(--font-display-family), Fraunces, ui-serif, Georgia, serif',
  mono: 'var(--font-mono-family), "IBM Plex Mono", ui-monospace, monospace',
};

const spstTypography = {
  fontFamily: fonts.body,
  fontSize: 14,
  h1: { fontFamily: fonts.display, fontWeight: 600, letterSpacing: "-0.02em" },
  h2: { fontFamily: fonts.display, fontWeight: 600, letterSpacing: "-0.02em" },
  h3: { fontFamily: fonts.display, fontWeight: 600 },
  h4: { fontFamily: fonts.display, fontWeight: 600 },
  h5: { fontFamily: fonts.display, fontWeight: 600 },
  h6: { fontFamily: fonts.display, fontWeight: 500 },
  button: { fontWeight: 600, letterSpacing: "0.01em" },
  overline: {
    fontFamily: fonts.mono,
    fontSize: "0.68rem",
    letterSpacing: "0.18em",
  },
} satisfies NonNullable<RaThemeOptions["typography"]>;

function shellOverrides(mode: "light" | "dark") {
  const isDark = mode === "dark";
  const border = isDark ? "#2d3f52" : "#d9d0c2";
  const surface = isDark ? "#162230" : "#faf7f0";
  const surfaceRaised = isDark ? "#1a2836" : "#f4efe6";
  const ink = isDark ? "#f0ebe3" : "#0e1a24";
  const sage = isDark ? "#8fb896" : "#4d7356";
  const muted = isDark ? "#9aa8b5" : "#5a656f";
  const appBg = isDark ? "#0e1a24" : "#f7f3ea";

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: appBg,
          color: ink,
        },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: isDark ? "#2d3f52" : "#d9d0c2",
          borderRadius: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: `${surface} !important`,
          color: ink,
          boxShadow: "none",
          borderBottom: `1px solid ${border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: surface,
          borderRight: `1px solid ${border}`,
          color: ink,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 600,
          borderRadius: 0,
        },
        outlined: {
          borderColor: border,
          "&:hover": {
            borderColor: sage,
            backgroundColor: isDark
              ? "rgba(143, 184, 150, 0.08)"
              : "rgba(77, 115, 86, 0.08)",
          },
        },
        contained: {
          borderRadius: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 0,
          backgroundColor: surfaceRaised,
        },
        outlined: {
          borderColor: border,
          backgroundColor: surface,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${border}`,
          backgroundColor: surface,
          boxShadow: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: isDark ? "#12202c" : "#f7f3ea",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontFamily: fonts.mono,
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: muted,
          borderBottomColor: border,
        },
        body: {
          borderBottomColor: border,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          "&.Mui-selected": {
            backgroundColor: isDark
              ? "rgba(143, 184, 150, 0.14)"
              : "rgba(77, 115, 86, 0.12)",
            borderLeft: `3px solid ${sage}`,
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(143, 184, 150, 0.2)"
                : "rgba(77, 115, 86, 0.16)",
            },
          },
        },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          borderLeft: "3px solid transparent",
          borderRadius: 0,
          marginInline: 8,
          marginBlock: 2,
          color: muted,
          "&.RaMenuItemLink-active": {
            borderLeftColor: sage,
            backgroundColor: isDark
              ? "rgba(143, 184, 150, 0.14)"
              : "rgba(77, 115, 86, 0.12)",
            color: ink,
            fontWeight: 600,
          },
          "& .RaMenuItemLink-icon": {
            color: "inherit",
          },
        },
      },
    },
    RaLayout: {
      styleOverrides: {
        root: {
          "& .RaLayout-content": {
            backgroundColor: appBg,
            paddingTop: 8,
          },
          "& .RaLayout-appFrame": {
            backgroundColor: appBg,
          },
        },
      },
    },
    RaDatagrid: {
      styleOverrides: {
        root: {
          backgroundColor: surface,
          border: `1px solid ${border}`,
          "& .RaDatagrid-headerCell": {
            backgroundColor: surfaceRaised,
          },
          "& .RaDatagrid-rowCell": {
            borderBottomColor: border,
          },
        },
      },
    },
  } satisfies NonNullable<RaThemeOptions["components"]>;
}

export const adminLightTheme = deepmerge(bwLightTheme, {
  palette: {
    mode: "light",
    primary: {
      main: "#0e1a24",
      light: "#5a656f",
      dark: "#0a1219",
      contrastText: "#f7f3ea",
    },
    secondary: {
      main: "#4d7356",
      light: "#8fb896",
      dark: "#3d5c45",
      contrastText: "#f7f3ea",
    },
    background: {
      default: "#f7f3ea",
      paper: "#faf7f0",
    },
    text: {
      primary: "#0e1a24",
      secondary: "#5a656f",
    },
    divider: "#d9d0c2",
    success: { main: "#4d7356", contrastText: "#f7f3ea" },
    error: { main: "#b42318" },
    warning: { main: "#c97d4a" },
    info: { main: "#5f7d5b" },
    action: {
      selected: "rgba(77, 115, 86, 0.12)",
      hover: "rgba(14, 26, 36, 0.04)",
    },
  },
  shape: { borderRadius: 0 },
  typography: spstTypography,
  components: shellOverrides("light"),
  sidebar: { width: 248, closedWidth: 56 },
}) as RaThemeOptions;

export const adminDarkTheme = deepmerge(bwDarkTheme, {
  palette: {
    mode: "dark",
    primary: {
      main: "#f0ebe3",
      light: "#ffffff",
      dark: "#c8c0b4",
      contrastText: "#0e1a24",
    },
    secondary: {
      main: "#8fb896",
      light: "#b5d0ba",
      dark: "#6f9d78",
      contrastText: "#0e1a24",
    },
    background: {
      default: "#0e1a24",
      paper: "#162230",
    },
    text: {
      primary: "#f0ebe3",
      secondary: "#9aa8b5",
    },
    divider: "#2d3f52",
    success: { main: "#8fb896", contrastText: "#0e1a24" },
    error: { main: "#ff7a59" },
    warning: { main: "#e08a5a" },
    info: { main: "#9ab896" },
    action: {
      selected: "rgba(143, 184, 150, 0.14)",
      hover: "rgba(240, 235, 227, 0.06)",
    },
  },
  shape: { borderRadius: 0 },
  typography: spstTypography,
  components: shellOverrides("dark"),
  sidebar: { width: 248, closedWidth: 56 },
}) as RaThemeOptions;

/** @deprecated use adminLightTheme */
export const adminTheme = adminLightTheme;
