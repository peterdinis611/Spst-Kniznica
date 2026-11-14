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
      className={cn(
        "shrink-0 text-[1.05rem] font-semibold tracking-tight text-ink sm:text-lg",
        className,
      )}
    >
      SPST Knižnica
      {showDot ? <span className="text-accent">.</span> : null}
    </Link>
  );
}
