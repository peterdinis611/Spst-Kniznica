import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  showDot?: boolean;
};

export function BrandLogo({
  href = "/",
  className,
  showDot = true,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      data-tour="brand"
      aria-label="SPST Knižnica — domov"
      className={cn(
        "text-[0.95rem] font-semibold tracking-tight text-ink min-[380px]:text-[1.05rem] sm:text-lg",
        className,
      )}
    >
      SPST Knižnica
      {showDot ? <span className="text-accent" aria-hidden>.</span> : null}
    </Link>
  );
}
