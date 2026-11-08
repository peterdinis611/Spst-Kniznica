import { cn } from "@/lib/utils";

type FlatCoverProps = {
  title: string;
  author?: string;
  accent: string;
  secondary?: string;
  className?: string;
};

export function FlatCover({
  title,
  author,
  accent,
  secondary = "#F7F7F7",
  className,
}: FlatCoverProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden p-4 text-white shadow-[8px_12px_0_rgba(11,11,11,0.12)]",
        className,
      )}
      style={{
        background: `linear-gradient(160deg, ${accent} 0%, ${shade(accent, -28)} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-3 bottom-10 border border-white/25"
      />
      <p className="relative font-display text-[clamp(0.95rem,2vw,1.35rem)] leading-tight">
        {title}
      </p>
      {author ? (
        <p className="relative text-[10px] tracking-[0.12em] uppercase opacity-80">
          {author}
        </p>
      ) : (
        <span
          aria-hidden
          className="relative mt-auto h-8 w-8 rounded-full"
          style={{ background: secondary }}
        />
      )}
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
