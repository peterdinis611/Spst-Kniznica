import type { Metadata } from "next";
import { MainContent } from "@/components/a11y/MainContent";
import { ReactAdminMount } from "@/components/admin/ReactAdminMount";

export const metadata: Metadata = {
  title: "Správa knižnice",
  description: "Prevádzkový pult SPST Knižnice (react-admin).",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <MainContent className="min-h-full flex-1">
      <ReactAdminMount />
    </MainContent>
  );
}
