"use client";

import type { ReactNode } from "react";
import { Layout } from "react-admin";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { AdminThemeSync } from "@/components/admin/AdminThemeSync";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell min-w-0 overflow-x-clip">
      <AdminThemeSync />
      <Layout menu={AdminMenu}>{children}</Layout>
    </div>
  );
}
