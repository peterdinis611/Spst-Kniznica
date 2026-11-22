import type { Decorator } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import {
  Admin,
  RecordContextProvider,
  Resource,
  testDataProvider,
  testI18nProvider,
  type AuthProvider,
  type RaRecord,
} from "react-admin";
import ListIcon from "@mui/icons-material/List";

const stubAuthProvider: AuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(["admin"]),
};

/** Minimal react-admin shell (QueryClient + notify + i18n). */
export function AdminStoryShell({ children }: { children: ReactNode }) {
  return (
    <Admin
      dataProvider={testDataProvider()}
      authProvider={stubAuthProvider}
      i18nProvider={testI18nProvider()}
      requireAuth={false}
      title="SPST správa (story)"
    >
      <Resource
        name="story"
        list={() => <>{children}</>}
        icon={ListIcon}
        options={{ label: "Story" }}
      />
    </Admin>
  );
}

export function withAdminShell(): Decorator {
  function AdminShellDecorator(Story: Parameters<Decorator>[0]) {
    return (
      <AdminStoryShell>
        <div className="p-6">
          <Story />
        </div>
      </AdminStoryShell>
    );
  }
  return AdminShellDecorator;
}

export function withAdminRecord(record: RaRecord): Decorator {
  function AdminRecordDecorator(Story: Parameters<Decorator>[0]) {
    return (
      <AdminStoryShell>
        <div className="p-6">
          <RecordContextProvider value={record}>
            <Story />
          </RecordContextProvider>
        </div>
      </AdminStoryShell>
    );
  }
  return AdminRecordDecorator;
}
