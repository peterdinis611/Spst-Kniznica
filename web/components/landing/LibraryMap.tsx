"use client";

import { useEffect, useState } from "react";

type Geocode = {
  displayName: string;
  osmEmbedUrl: string;
  osmUrl: string;
};

export function LibraryMap() {
  const [data, setData] = useState<Geocode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geocode", { cache: "force-cache" });
        if (!res.ok) throw new Error("Geocode zlyhal");
        const json = (await res.json()) as Geocode;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mapa nedostupná");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">{error}</p>
    );
  }

  if (!data) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">
        Načítavam mapu…
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{data.displayName}</p>
      <iframe
        title="Poloha knižnice"
        src={data.osmEmbedUrl}
        className="h-40 w-full border border-rule dark:border-white/10"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={data.osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[11px] text-sage underline-offset-2 hover:underline"
      >
        Otvoriť v OpenStreetMap
      </a>
    </div>
  );
}
