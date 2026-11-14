"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import {
  addFavoriteAction,
  listFavoritesAction,
  removeFavoriteByBookAction,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteToggle({ bookId }: { bookId: string }) {
  const { user, getAccessToken, entraEnabled } = useAuth();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = useAction(listFavoritesAction);
  const add = useAction(addFavoriteAction);
  const remove = useAction(removeFavoriteByBookAction);

  useEffect(() => {
    if (!user?.isAuthenticated) {
      setActive(false);
      return;
    }
    void (async () => {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      const result = await list.executeAsync({ accessToken });
      const found = (result?.data ?? []).some((f) => f.bookId === bookId);
      setActive(found);
    })();
  }, [user?.isAuthenticated, bookId, entraEnabled, getAccessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAuthenticated) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      className={cn(
        "h-11 rounded-none border-rule",
        active && "border-stair-2 text-stair-2",
      )}
      onClick={async () => {
        setBusy(true);
        const accessToken = await resolveActionAccessToken({
          entraEnabled,
          getAccessToken,
        });
        if (active) {
          await remove.executeAsync({ bookId, accessToken });
          setActive(false);
        } else {
          await add.executeAsync({ bookId, accessToken });
          setActive(true);
        }
        setBusy(false);
      }}
    >
      <Heart
        className={cn("size-4", active && "fill-current")}
        aria-hidden
      />
      {active ? "V obľúbených" : "Do obľúbených"}
    </Button>
  );
}
