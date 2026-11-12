import type { CoverMotif } from "@/lib/catalog";

type BookCoverProps = {
  title: string;
  author?: string;
  accent: string;
  secondary?: string;
  motif?: CoverMotif;
  className?: string;
};

export function BookCover({
  title,
  author,
  accent,
  secondary = "#f7f2ea",
  className = "",
}: BookCoverProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.1rem] shadow-[0_16px_36px_rgba(26,23,20,0.14)] ${className}`}
      style={{
        background: `linear-gradient(160deg, ${accent} 0%, ${shade(accent, -28)} 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20"
        style={{ background: secondary }}
      />
      <div className="relative flex h-full flex-col justify-between p-4 text-[color:var(--paper)]">
        <p className="font-display text-lg leading-tight md:text-xl">{title}</p>
        {author ? (
          <p className="text-xs tracking-[0.04em] opacity-80">{author}</p>
        ) : null}
      </div>
    </div>
  );
}

function shade(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const num = Number.parseInt(value, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
