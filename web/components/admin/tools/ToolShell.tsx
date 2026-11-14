"use client";

import type { ReactNode } from "react";
import { Title } from "react-admin";

export function ToolShell({
  title,
  eyebrow,
  lead,
  children,
}: {
  title: string;
  eyebrow: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Title title={title} />
      <header className="border-b border-rule pb-5 dark:border-white/10">
        <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.75rem,3.5vw,2.4rem)] leading-none tracking-tight text-ink">
          {title}
        </h1>
        {lead ? (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{lead}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function ToolCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-rule bg-card/70 p-4 dark:border-white/10 dark:bg-paper-deep/70">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
