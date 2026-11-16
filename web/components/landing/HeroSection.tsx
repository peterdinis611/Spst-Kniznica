import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import type { CarouselBook } from "@/lib/catalog";

type HeroSectionProps = {
  books: CarouselBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const left = books[0] ?? {
    id: "fallback-1",
    title: "Psychológia peňazí",
    author: "Morgan Housel",
    accent: "#8FA888",
    secondary: "#E8F0E6",
  };
  const right = books[1] ?? {
    id: "fallback-2",
    title: "Ako funguje inovácia",
    author: "Matt Ridley",
    accent: "#1F4E8C",
    secondary: "#D8E8F0",
  };

  return (
    <section
      className="relative z-10 mx-auto grid w-full min-w-0 max-w-6xl items-center gap-8 px-4 pb-4 pt-2 sm:gap-10 sm:px-6 sm:pb-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-4"
      aria-labelledby="hero-heading"
    >
      <div className="min-w-0 max-w-xl">
        <p className="reveal text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Školský katalóg
        </p>
        <h1
          id="hero-heading"
          className="reveal reveal-delay-1 mt-3 font-display text-[clamp(2rem,8vw,4.6rem)] leading-[1.05] font-medium tracking-[-0.02em] text-balance text-ink sm:mt-4"
        >
          Akú knihu{" "}
          <em className="not-italic text-ink">hľadáte?</em>
        </h1>
        <p className="reveal reveal-delay-2 mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-[15px]">
          Nie ste si istí, čo čítať ďalej? Prehliadnite fond SPST — autori,
          kategórie a dostupnosť exemplárov na jednom mieste.
        </p>

        <div className="reveal reveal-delay-3 mt-6 flex w-full min-w-0 flex-col items-stretch gap-3 sm:mt-8 sm:items-start">
          <Link
            href="/books"
            className="split-cta group w-full max-w-sm border border-ink bg-paper transition hover:-translate-y-0.5 sm:w-auto"
          >
            <span className="flex items-center px-5 py-3.5 text-sm font-semibold tracking-wide sm:px-6">
              Preskúmať teraz
            </span>
            <span className="flex items-center justify-center bg-ink px-4 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </span>
          </Link>
          <Link
            href="/bookings"
            className="inline-flex text-sm font-medium text-ink/70 underline-offset-4 hover:text-ink hover:underline"
          >
            Alebo otvor výpožičný pult
          </Link>
        </div>

        <div className="reveal reveal-delay-4 mt-8 flex items-center gap-3 sm:mt-10">
          <div className="flex shrink-0 -space-x-2">
            {["#FFE500", "#FF5C33", "#8FA888", "#1F4E8C"].map((color) => (
              <span
                key={color}
                className="size-8 rounded-full border-2 border-paper sm:size-9"
                style={{ background: color }}
                aria-hidden
              />
            ))}
          </div>
          <p className="min-w-0 text-xs leading-snug text-muted-foreground sm:text-sm">
            <span className="font-semibold text-ink">Žiaci + učitelia</span>
            <br />
            čítajú so SPST knižnicou
          </p>
        </div>
      </div>

      <div className="reveal reveal-delay-2 relative mx-auto flex h-[260px] w-full min-w-0 max-w-[22rem] items-center justify-center sm:h-[340px] sm:max-w-md lg:mx-0 lg:h-[420px] lg:max-w-none">
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
          className="absolute top-[8%] left-[10%] z-10 w-[42%] max-w-[11rem] rotate-[-11deg] transition hover:-translate-y-1"
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
          className="absolute right-[4%] bottom-[6%] z-20 w-[46%] max-w-[12rem] rotate-[8deg] transition hover:-translate-y-1"
        >
          <FlatCover
            title={right.title}
            author={right.author}
            accent={right.accent}
            secondary={right.secondary}
          />
        </Link>

        <div className="sunburst absolute top-[42%] left-[48%] z-30 flex size-[4.5rem] items-center justify-center bg-accent text-center sm:size-[5.5rem] lg:size-24">
          <p className="font-display text-[11px] leading-tight font-semibold text-accent-foreground sm:text-sm lg:text-base">
            Otvorený
            <br />
            fond
          </p>
        </div>
      </div>
    </section>
  );
}
