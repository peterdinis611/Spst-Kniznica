"use client";

import type { ReactNode } from "react";
import { SignInRequiredNotice } from "@/components/auth/NotAuthorizedNotice";

type AuthRequiredGateProps = {
  ready: boolean;
  allowed: boolean;
  loadingFallback: ReactNode;
  eyebrow: string;
  title?: string;
  description: string;
  hint?: string;
  children: ReactNode;
};

export function AuthRequiredGate({
  ready,
  allowed,
  loadingFallback,
  eyebrow,
  title = "Len pre prihlásených",
  description,
  hint,
  children,
}: AuthRequiredGateProps) {
  if (!ready) {
    return <>{loadingFallback}</>;
  }

  if (!allowed) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center py-8 sm:py-14">
        <SignInRequiredNotice
          variant="page"
          eyebrow={eyebrow}
          title={title}
          description={description}
          hint={hint}
        />
      </div>
    );
  }

  return <>{children}</>;
}
