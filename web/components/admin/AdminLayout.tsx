"use client";

import type { ReactNode } from "react";
import { Layout } from "react-admin";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { AdminOpsSync } from "@/components/admin/AdminOpsSync";
import { AdminThemeSync } from "@/components/admin/AdminThemeSync";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell min-w-0 overflow-x-clip">
      <AdminThemeSync />
      <AdminOpsSync />
      <Layout menu={AdminMenu}>{children}</Layout>
    </div>
  );
}
