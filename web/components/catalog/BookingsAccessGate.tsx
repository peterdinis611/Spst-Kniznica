"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAbility } from "@/components/auth/AbilityProvider";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { BookingsDesk } from "@/components/catalog/BookingsDesk";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { useCatalogRefs } from "@/hooks/use-catalog-refs";

export function BookingsAccessGate() {
  const { ready, entraEnabled } = useAuth();
  const ability = useAbility();
  const { catalog } = useCatalogRefs();

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
      <BookingsDesk
        initialBookings={[]}
        initialTotal={0}
        catalog={catalog}
      />
    </AuthRequiredGate>
  );
}
