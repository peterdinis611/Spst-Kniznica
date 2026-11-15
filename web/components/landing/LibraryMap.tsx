"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

type Geocode = {
  displayName: string;
  osmEmbedUrl: string;
  osmUrl: string;
};

type LibraryMapProps = {
  query?: string;
  className?: string;
};

export function LibraryMap({
  query = siteConfig.geocodeQuery,
  className,
}: LibraryMapProps) {
  const [data, setData] = useState<Geocode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q: query });
    (async () => {
      try {
        const res = await fetch(`/api/geocode?${params.toString()}`, {
          cache: "force-cache",
        });
        if (!res.ok) throw new Error("Geokódovanie zlyhalo");
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
  }, [query]);

  if (error) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground" role="status">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <p
        className="font-mono text-[11px] text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Načítavam mapu…
      </p>
    );
  }

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {data.displayName}
      </p>
      <iframe
        title={`Mapa školy: ${siteConfig.addressShort}`}
        src={data.osmEmbedUrl}
        className="h-44 w-full border border-rule bg-paper-deep dark:border-white/10 sm:h-52"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <Link
        href={data.osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono text-[11px] tracking-wide text-sage underline-offset-2 hover:underline"
      >
        Otvoriť v OpenStreetMap
        <span className="sr-only"> (nové okno)</span>
      </Link>
    </div>
  );
}
