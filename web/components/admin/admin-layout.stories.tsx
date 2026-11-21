import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Admin, Resource, testDataProvider, testI18nProvider } from "react-admin";
import type { AuthProvider } from "react-admin";
import ListIcon from "@mui/icons-material/List";
import { AdminLayout } from "./AdminLayout";

const stubAuthProvider: AuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(["admin"]),
};

const StubList = () => (
  <div className="p-6">
    <h1 className="text-lg font-semibold">Ukážkový obsah adminu</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Layout zo `react-admin` so shellom SPST a bočným menu.
    </p>
  </div>
);

const meta = {
  title: "Admin/AdminLayout",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Obal okolo `react-admin` `Layout` + `AdminMenu`. Story beží v minimálnom `Admin` kontexte s testovacím data providerom.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSampleChild: Story = {
  render: () => (
    <Admin
      dataProvider={testDataProvider()}
      authProvider={stubAuthProvider}
      i18nProvider={testI18nProvider()}
      layout={AdminLayout}
      requireAuth={false}
      title="SPST správa (story)"
    >
      <Resource
        name="books"
        list={StubList}
        icon={ListIcon}
        options={{ label: "Knihy" }}
      />
    </Admin>
  ),
};