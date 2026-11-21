"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAbility } from "@/components/auth/AbilityProvider";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { BookingsDeskLazy } from "@/components/catalog/BookingsDeskLazy";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export function BookingsAccessGate() {
  const { ready, entraEnabled } = useAuth();
  const ability = useAbility();

  return (
    <AuthRequiredGate
      ready={ready}
      allowed={ability.can("access", "BookingsPage")}
      loadingFallback={<CatalogSkeleton rows={4} />}
      eyebrow="Výpožičný pult"
      description={
        entraEnabled
          ? "Výpožičky a vlastné lístky sú dostupné po prihlásení školským účtom (Entra). Cudzie rezervácie nie sú verejné."
          : "Výpožičky a vlastné lístky sú dostupné až po prihlásení. Cudzie rezervácie nie sú verejné."
      }
    >
      <BookingsDeskLazy initialBookings={[]} initialTotal={0} />
    </AuthRequiredGate>
  );
}
