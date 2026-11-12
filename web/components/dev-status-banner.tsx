import { isDevelopmentStage } from "@/lib/site";

export function DevStatusBanner() {
  if (!isDevelopmentStage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 border-b border-black/10 bg-accent text-black dark:border-black/20"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 md:px-8">
        <p className="min-w-0 text-[12px] leading-snug sm:text-[13px]">
          <span className="mr-2 inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">
            Development
          </span>
          <span className="text-black/80">
            Aplikácia je v štádiu vývoja — funkcie a dáta sa môžu meniť.
          </span>
        </p>
        <span
          className="hidden shrink-0 font-mono text-[10px] tracking-[0.18em] text-black/55 uppercase sm:inline"
          aria-hidden
        >
          WIP
        </span>
      </div>
    </div>
  );
}
