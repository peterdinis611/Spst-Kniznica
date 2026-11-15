"use client";

import Link from "next/link";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

const FRONTEND = [
  { href: "/", label: "Úvodná stránka" },
  { href: "/books", label: "Katalóg kníh" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
  { href: "/bookings", label: "Pult výpožičiek" },
  { href: "/login", label: "Prihlásenie" },
] as const;

const SWAGGER = [
  { href: "http://localhost:5200/swagger", label: "API brána" },
  { href: "http://localhost:5203/swagger", label: "Služba kníh" },
  { href: "http://localhost:5204/swagger", label: "Služba kategórií" },
  { href: "http://localhost:5207/swagger", label: "Služba autorov" },
  { href: "http://localhost:5208/swagger", label: "Služba výpožičiek" },
  { href: "http://localhost:5209/swagger", label: "Služba fronty" },
  { href: "http://localhost:5205/swagger", label: "Služba správ" },
  { href: "http://localhost:5206/swagger", label: "Služba cache" },
  { href: "http://localhost:5210/swagger", label: "Služba autentifikácie" },
  { href: "http://localhost:5211/swagger", label: "Služba správy" },
] as const;

export function LinksToolsPage() {
  return (
    <ToolShell
      title="Odkazy"
      eyebrow="Navigácia · dokumentácia API"
      lead="Rýchle skoky do webovej aplikácie a vývojového Swagger UI služieb."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ToolCard title="Webová aplikácia">
          <ul className="space-y-1">
            {FRONTEND.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border border-transparent px-2 py-2 text-sm text-ink transition hover:border-rule hover:bg-mint/20 dark:hover:border-white/10"
                >
                  {item.label}
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    {item.href}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ToolCard>

        <ToolCard title="Swagger (lokálne)">
          <ul className="space-y-1">
            {SWAGGER.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-transparent px-2 py-2 text-sm text-ink transition hover:border-rule hover:bg-mint/20 dark:hover:border-white/10"
                >
                  {item.label}
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    :{new URL(item.href).port}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ToolCard>
      </div>
    </ToolShell>
  );
}
