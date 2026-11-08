import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  ExternalLink,
  LibraryBig,
  MoveHorizontal,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps: ReadonlyArray<{
  n: string;
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    n: "01",
    title: "Prehliadaj karusel",
    body: "Na landingu ťahaj 3D knižný rad. Stredná kniha je aktívna — bočné klikni, aby sa dostali dopredu.",
    Icon: MoveHorizontal,
  },
  {
    n: "02",
    title: "Otvor detail",
    body: "Klik na strednú obálku načíta stránku knihy s autorom, kategóriou a exemplármi z BookService.",
    Icon: BookOpenCheck,
  },
  {
    n: "03",
    title: "Choď do katalógu",
    body: "Sekcie Knihy, Autori a Kategórie vedú cez Gateway. Jedna kniha = jeden autor a jedna kategória.",
    Icon: LibraryBig,
  },
  {
    n: "04",
    title: "Použi API",
    body: "Swagger na porte 5200 spája mikroslužby. Redis cache a Kafka eventy držia katalóg v synchróne.",
    Icon: Server,
  },
];

export function HowToUse() {
  return (
    <section
      id="ako-pouzivat"
      className="relative z-10 border-t border-rule/70 bg-paper-deep/55"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] tracking-[0.22em] text-accent uppercase">
            Ako to používať
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.85rem,5vw,3rem)] text-ink">
            Od landingu po katalóg v štyroch krokoch
          </h2>
          <p className="mt-4 text-muted-foreground">
            SPST Knižnica je jednoduchá: nájdi titul, pozri detail, pokračuj k
            autorom alebo kategóriám.
          </p>
        </div>

        <ol className="mt-12 grid gap-0 md:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.n}
              className={`border-rule/80 py-8 md:px-8 ${
                index % 2 === 0 ? "md:border-r" : ""
              } ${index < 2 ? "md:border-b" : ""} ${
                index < steps.length - 1 ? "border-b md:border-b-0" : ""
              } ${index < 2 ? "" : "md:border-t-0"} ${
                index >= 2 ? "md:border-t md:border-rule/80" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/35 bg-paper text-accent">
                  <step.Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                </span>
                <p className="font-display text-sm tracking-[0.18em] text-accent">
                  {step.n}
                </p>
              </div>
              <h3 className="mt-3 font-display text-2xl text-ink">{step.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            size="lg"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent-deep"
            render={<Link href="/books" />}
          >
            Otvoriť katalóg
            <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            render={
              <a
                href="http://localhost:5200/swagger"
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            Gateway Swagger
            <ExternalLink className="size-3.5" strokeWidth={1.8} aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
