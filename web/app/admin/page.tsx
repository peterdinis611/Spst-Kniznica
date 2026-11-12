import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { AdminDashboard } from "@/components/auth/AdminDashboard";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Admin",
  description: "Prevádzkový pult SPST Knižnice (AdminService).",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 md:px-8">
        <BrandLogo />
        <ThemeToggle />
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 md:px-8">
        <AdminDashboard />
      </div>
    </main>
  );
}
