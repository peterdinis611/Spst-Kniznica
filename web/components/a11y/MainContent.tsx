import type { ReactNode } from "react";
import { MAIN_CONTENT_ID } from "@/lib/a11y/ids";
import { cn } from "@/lib/utils";

type MainContentProps = {
  children: ReactNode;
  className?: string;
};

/** Landmark for page content; target of the skip link. */
export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className={cn("outline-none focus:outline-none", className)}
    >
      {children}
    </main>
  );
}
