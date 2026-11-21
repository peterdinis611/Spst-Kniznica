import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Admin, Resource, testDataProvider, testI18nProvider } from "react-admin";
import type { AuthProvider } from "react-admin";
import BuildIcon from "@mui/icons-material/Build";
import { ToolCard, ToolShell } from "./tools/ToolShell";

const stubAuthProvider: AuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(["admin"]),
};

const meta = {
  title: "Admin/ToolShell",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "`ToolShell` a `ToolCard` vyžadujú kontext `react-admin` kvôli komponentu `Title`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Ukážka nástroja",
  render: () => (
    <Admin
      dataProvider={testDataProvider()}
      authProvider={stubAuthProvider}
      i18nProvider={testI18nProvider()}
      requireAuth={false}
      title="SPST správa (story)"
    >
      <Resource
        name="tools"
        list={() => (
          <ToolShell
            title="Zdravie služieb"
            eyebrow="Nástroje"
            lead="Rýchly prehľad konfigurácie a stavu mikroslužieb."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ToolCard title="Posledná kontrola">
                <p className="text-sm text-muted-foreground">
                  Všetky kontroly prebehli pred 4 minútami. Ďalší beh o 10 minút.
                </p>
              </ToolCard>
              <ToolCard title="Akcia">
                <p className="text-sm text-muted-foreground">
                  Spusti manuálny health check alebo export logov do JSON.
                </p>
              </ToolCard>
            </div>
          </ToolShell>
        )}
        icon={BuildIcon}
        options={{ label: "Nástroje" }}
      />
    </Admin>
  ),
};