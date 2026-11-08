import { CatalogShell } from "@/components/catalog/CatalogShell";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CatalogShell>{children}</CatalogShell>;
}
