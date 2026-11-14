"use client";

import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";
import BookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import { adminAuthProvider } from "@/lib/admin/auth-provider";
import { adminDataProvider } from "@/lib/admin/data-provider";
import { adminI18nProvider } from "@/lib/admin/i18n";
import { adminDarkTheme, adminLightTheme } from "@/lib/admin/theme";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminRaDashboard } from "@/components/admin/Dashboard";
import {
  AuthorCreate,
  AuthorEdit,
  AuthorList,
  AuthorShow,
} from "@/components/admin/resources/authors";
import {
  AuditLogList,
  AuditLogShow,
} from "@/components/admin/resources/audit-logs";
import {
  BookCreate,
  BookEdit,
  BookList,
  BookShow,
} from "@/components/admin/resources/books";
import {
  BookingCreate,
  BookingEdit,
  BookingList,
  BookingShow,
} from "@/components/admin/resources/bookings";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  CategoryShow,
} from "@/components/admin/resources/categories";
import { AccountPage } from "@/components/admin/tools/AccountPage";
import { BookImportPage } from "@/components/admin/tools/BookImportPage";
import { CacheToolsPage } from "@/components/admin/tools/CacheToolsPage";
import { GatewayToolsPage } from "@/components/admin/tools/GatewayToolsPage";
import { HealthToolsPage } from "@/components/admin/tools/HealthToolsPage";
import { LinksToolsPage } from "@/components/admin/tools/LinksToolsPage";
import { MessagingToolsPage } from "@/components/admin/tools/MessagingToolsPage";
import { OrdersToolsPage } from "@/components/admin/tools/OrdersToolsPage";
import { RelationsPage } from "@/components/admin/tools/RelationsPage";
import { ServicesRegistryPage } from "@/components/admin/tools/ServicesRegistryPage";

export default function ReactAdminApp() {
  return (
    <Admin
      dataProvider={adminDataProvider}
      authProvider={adminAuthProvider}
      i18nProvider={adminI18nProvider}
      dashboard={AdminRaDashboard}
      theme={adminLightTheme}
      darkTheme={adminDarkTheme}
      defaultTheme="light"
      layout={AdminLayout}
      loginPage={AdminLoginPage}
      requireAuth
      title="SPST Admin"
    >
      <Resource
        name="books"
        list={BookList}
        show={BookShow}
        edit={BookEdit}
        create={BookCreate}
        icon={BookIcon}
        recordRepresentation="title"
      />
      <Resource
        name="authors"
        list={AuthorList}
        show={AuthorShow}
        edit={AuthorEdit}
        create={AuthorCreate}
        icon={PersonIcon}
        recordRepresentation="name"
      />
      <Resource
        name="categories"
        list={CategoryList}
        show={CategoryShow}
        edit={CategoryEdit}
        create={CategoryCreate}
        icon={CategoryIcon}
        recordRepresentation="name"
      />
      <Resource
        name="bookings"
        list={BookingList}
        show={BookingShow}
        edit={BookingEdit}
        create={BookingCreate}
        icon={AssignmentIcon}
      />
      <Resource
        name="audit-logs"
        list={AuditLogList}
        show={AuditLogShow}
        icon={HistoryIcon}
        options={{ label: "Audit logy" }}
      />
      <CustomRoutes>
        <Route path="/tools/import" element={<BookImportPage />} />
        <Route path="/tools/gateway" element={<GatewayToolsPage />} />
        <Route path="/tools/health" element={<HealthToolsPage />} />
        <Route path="/tools/services" element={<ServicesRegistryPage />} />
        <Route path="/tools/cache" element={<CacheToolsPage />} />
        <Route path="/tools/messaging" element={<MessagingToolsPage />} />
        <Route path="/tools/relations" element={<RelationsPage />} />
        <Route path="/tools/orders" element={<OrdersToolsPage />} />
        <Route path="/tools/links" element={<LinksToolsPage />} />
        <Route path="/tools/account" element={<AccountPage />} />
      </CustomRoutes>
    </Admin>
  );
}
