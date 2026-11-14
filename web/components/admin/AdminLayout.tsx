"use client";

import type { ReactNode } from "react";
import { Layout } from "react-admin";
import { AdminThemeSync } from "@/components/admin/AdminThemeSync";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminThemeSync />
      <Layout>{children}</Layout>
    </>
  );
}
