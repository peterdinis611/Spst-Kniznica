"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
};

export function RouteError({
  error,
  reset,
  title = "Niečo sa pokazilo",
  description = "Stránku sa nepodarilo načítať. Skús to znova, alebo sa vráť na úvod.",
  homeHref = "/",
}: RouteErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 md:px-8">
      <div className="border border-rule bg-paper-deep/40 p-6 sm:p-8 dark:border-white/10">
        <div className="flex size-11 items-center justify-center border border-rule bg-paper text-ink dark:border-white/15">
          <AlertTriangle className="size-5" strokeWidth={1.8} aria-hidden />
        </div>
        <p className="mt-5 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Chyba
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground">
            digest: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-11 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
            onClick={reset}
          >
            <RotateCcw className="size-4" strokeWidth={1.8} aria-hidden />
            Skúsiť znova
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-none border-ink"
            render={<Link href={homeHref} />}
          >
            Domov
          </Button>
        </div>
      </div>
    </main>
  );
}
