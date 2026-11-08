import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import type { CarouselBook } from "@/lib/types";

type HeroSectionProps = {
  books: CarouselBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const left = books[0] ?? {
    id: "fallback-1",
    title: "Psychology of Money",
    author: "Morgan Housel",
    accent: "#8FA888",
    secondary: "#E8F0E6",
  };
  const right = books[1] ?? {
    id: "fallback-2",
    title: "How Innovation Works",
    author: "Matt Ridley",
    accent: "#1F4E8C",
    secondary: "#F6E27A",
  };

  return (
    <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-6 pt-2 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:px-8 md:pb-4 md:pt-2">
      <div className="max-w-xl">
        <p className="reveal text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Školský katalóg
        </p>
        <h1 className="reveal reveal-delay-1 mt-4 font-display text-[clamp(2.4rem,7.2vw,4.6rem)] leading-[1.02] font-medium tracking-[-0.02em] text-ink">
          Akú knihu{" "}
          <em className="not-italic text-ink">hľadáte?</em>
        </h1>
        <p className="reveal reveal-delay-2 mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          Nie ste si istí, čo čítať ďalej? Prehliadnite fond SPST — autori,
          kategórie a dostupnosť exemplárov na jednom mieste.
        </p>

        <div className="reveal reveal-delay-3 mt-8">
          <Link
            href="/books"
            className="split-cta group border border-ink bg-paper transition hover:-translate-y-0.5"
          >
            <span className="flex items-center px-6 py-3.5 text-sm font-semibold tracking-wide">
              Preskúmať teraz
            </span>
            <span className="flex items-center justify-center bg-ink px-4 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </span>
          </Link>
        </div>

        <div className="reveal reveal-delay-4 mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#FFE500", "#FF5C33", "#8FA888", "#1F4E8C"].map((color) => (
              <span
                key={color}
                className="size-9 rounded-full border-2 border-paper"
                style={{ background: color }}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
            <span className="font-semibold text-ink">Žiaci + učitelia</span>
            <br />
            čítajú so SPST knižnicou
          </p>
        </div>
      </div>

      <div className="reveal reveal-delay-2 relative mx-auto flex h-[320px] w-full max-w-md items-center justify-center sm:h-[380px] md:mx-0 md:h-[420px] md:max-w-none">
        <div
          aria-hidden
          className="absolute top-[12%] left-[8%] h-[58%] w-[42%] bg-sage/70"
        />
        <div
          aria-hidden
          className="absolute right-[6%] bottom-[8%] h-[62%] w-[46%] bg-accent"
        />

        <Link
          href={`/books/${left.id}`}
          className="absolute top-[8%] left-[10%] z-10 w-[42%] rotate-[-11deg] transition hover:-translate-y-1"
        >
          <FlatCover
            title={left.title}
            author={left.author}
            accent={left.accent}
            secondary={left.secondary}
          />
        </Link>

        <Link
          href={`/books/${right.id}`}
          className="absolute right-[4%] bottom-[6%] z-20 w-[46%] rotate-[8deg] transition hover:-translate-y-1"
        >
          <FlatCover
            title={right.title}
            author={right.author}
            accent={right.accent}
            secondary={right.secondary}
          />
        </Link>

        <div className="sunburst absolute top-[42%] left-[48%] z-30 flex size-[5.5rem] items-center justify-center bg-accent text-center sm:size-24">
          <p className="font-display text-sm leading-tight font-semibold text-accent-foreground sm:text-base">
            Otvorený
            <br />
            fond
          </p>
        </div>
      </div>
    </section>
  );
}
