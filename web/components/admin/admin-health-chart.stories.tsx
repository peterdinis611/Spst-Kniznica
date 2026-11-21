import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdminHealthChart } from "@/components/auth/AdminHealthChart";

const lightTheme = createTheme({ palette: { mode: "light" } });
const darkTheme = createTheme({ palette: { mode: "dark" } });

const healthyServices = [
  { name: "CatalogService", healthy: true, status: "Running" },
  { name: "BookingService", healthy: true, status: "Running" },
  { name: "IdentityGateway", healthy: true, status: "Running" },
  { name: "NotifyService", healthy: true, status: "Running" },
];

const mixedServices = [
  { name: "CatalogService", healthy: true, status: "Running" },
  { name: "BookingService", healthy: false, status: "Degraded" },
  { name: "IdentityGateway", healthy: true, status: "Running" },
  { name: "NotifyService", healthy: false, status: "Down" },
  { name: "ImportService", healthy: true, status: "Running" },
];

const meta = {
  title: "Admin/AdminHealthChart",
  component: AdminHealthChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={lightTheme}>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof AdminHealthChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VsetkoVporiadku: Story = {
  name: "Všetko v poriadku",
  args: {
    services: healthyServices,
    healthyCount: 4,
    unhealthyCount: 0,
  },
};

export const ZmiesanyStav: Story = {
  name: "Zmiešaný stav",
  args: {
    services: mixedServices,
    healthyCount: 3,
    unhealthyCount: 2,
  },
};

export const TmavaTema: Story = {
  name: "Tmavá téma",
  decorators: [
    (Story) => (
      <ThemeProvider theme={darkTheme}>
        <div className="dark rounded-lg bg-paper-deep p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  args: {
    services: mixedServices,
    healthyCount: 3,
    unhealthyCount: 2,
  },
};