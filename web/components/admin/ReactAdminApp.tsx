"use client";

import { Admin, Resource } from "react-admin";
import BookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import AssignmentIcon from "@mui/icons-material/Assignment";
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
} from "@/components/admin/resources/authors";
import {
  BookCreate,
  BookEdit,
  BookList,
} from "@/components/admin/resources/books";
import {
  BookingCreate,
  BookingEdit,
  BookingList,
} from "@/components/admin/resources/bookings";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
} from "@/components/admin/resources/categories";

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
        edit={BookEdit}
        create={BookCreate}
        icon={BookIcon}
        recordRepresentation="title"
      />
      <Resource
        name="authors"
        list={AuthorList}
        edit={AuthorEdit}
        create={AuthorCreate}
        icon={PersonIcon}
        recordRepresentation="name"
      />
      <Resource
        name="categories"
        list={CategoryList}
        edit={CategoryEdit}
        create={CategoryCreate}
        icon={CategoryIcon}
        recordRepresentation="name"
      />
      <Resource
        name="bookings"
        list={BookingList}
        edit={BookingEdit}
        create={BookingCreate}
        icon={AssignmentIcon}
      />
    </Admin>
  );
}
