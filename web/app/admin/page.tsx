import type { Metadata } from "next";
import { ReactAdminMount } from "@/components/admin/ReactAdminMount";

export const metadata: Metadata = {
  title: "Admin",
  description: "Prevádzkový pult SPST Knižnice (react-admin).",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <ReactAdminMount />;
}
