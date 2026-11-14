"use client";

import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

const FRONTEND = [
  { href: "/", label: "Landing" },
  { href: "/books", label: "Katalóg kníh" },
  { href: "/authors", label: "Autori" },
  { href: "/categories", label: "Kategórie" },
  { href: "/bookings", label: "Pult výpožičiek" },
  { href: "/login", label: "Prihlásenie" },
] as const;

const SWAGGER = [
  { href: "http://localhost:5200/swagger", label: "Gateway" },
  { href: "http://localhost:5203/swagger", label: "BookService" },
  { href: "http://localhost:5204/swagger", label: "CategoryService" },
  { href: "http://localhost:5207/swagger", label: "AuthorService" },
  { href: "http://localhost:5208/swagger", label: "BookingService" },
  { href: "http://localhost:5209/swagger", label: "WorkersService" },
  { href: "http://localhost:5205/swagger", label: "MessagingService" },
  { href: "http://localhost:5206/swagger", label: "CacheService" },
  { href: "http://localhost:5210/swagger", label: "AuthService" },
  { href: "http://localhost:5211/swagger", label: "AdminService" },
] as const;

export function LinksToolsPage() {
  return (
    <ToolShell
      title="Odkazy"
      eyebrow="Navigácia · Swagger"
      lead="Rýchle skoky do frontendu a Development Swagger UI služieb."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ToolCard title="Frontend">
          <ul className="space-y-1">
            {FRONTEND.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block border border-transparent px-2 py-2 text-sm text-ink transition hover:border-rule hover:bg-mint/20 dark:hover:border-white/10"
                >
                  {item.label}
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    {item.href}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </ToolCard>

        <ToolCard title="Swagger (local)">
          <ul className="space-y-1">
            {SWAGGER.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-transparent px-2 py-2 text-sm text-ink transition hover:border-rule hover:bg-mint/20 dark:hover:border-white/10"
                >
                  {item.label}
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    :{new URL(item.href).port}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </ToolCard>
      </div>
    </ToolShell>
  );
}
