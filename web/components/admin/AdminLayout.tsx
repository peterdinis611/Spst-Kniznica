"use client";

import type { ReactNode } from "react";
import { Layout } from "react-admin";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { AdminThemeSync } from "@/components/admin/AdminThemeSync";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminThemeSync />
      <Layout menu={AdminMenu}>{children}</Layout>
    </>
  );
}
