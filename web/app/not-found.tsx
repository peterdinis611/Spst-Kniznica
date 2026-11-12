import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 md:px-8">
      <div className="border border-rule bg-paper-deep/40 p-6 sm:p-8 dark:border-white/10">
        <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] tracking-tight text-ink">
          Stránka neexistuje
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Táto cesta v katalógu SPST nie je. Skontroluj URL, alebo sa vráť na
          úvodnú stránku.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-11 rounded-none bg-accent px-5 text-black hover:bg-accent-deep"
            render={<Link href="/" />}
          >
            Domov
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-none border-ink"
            render={<Link href="/books" />}
          >
            Katalóg kníh
          </Button>
        </div>
      </div>
    </main>
  );
}
