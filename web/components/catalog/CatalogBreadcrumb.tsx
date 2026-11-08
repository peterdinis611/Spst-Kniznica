import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = {
  label: string;
  href?: string;
};

export function CatalogBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumb className="mb-5">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Domov</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {last || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} />}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
