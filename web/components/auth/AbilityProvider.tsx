"use client";

import {
  AbilityProvider as CaslAbilityProvider,
  Can,
  useAbility,
} from "@casl/react";
import { useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { defineAbilityFor } from "@/lib/auth/ability";

export { Can, useAbility };

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ability = useMemo(() => defineAbilityFor(user), [user]);

  return (
    <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>
  );
}
