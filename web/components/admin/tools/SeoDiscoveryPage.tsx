"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";
import type {
  DiscoveryKind,
  DiscoverySnapshot,
} from "@/lib/seo/discovery-monitor";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<DiscoveryKind, string> = {
  "llms.txt": "llms.txt",
  "llms-full.txt": "llms-full.txt",
  "overview.md": "overview.md",
  "sitemap.xml": "sitemap.xml",
  "robots.txt": "robots.txt",
  "book.md": "knihy .md",
  "author.md": "autori .md",
  "category.md": "kategórie .md",
};

export function SeoDiscoveryPage() {
  const notify = useNotify();
  const [data, setData] = useState<DiscoverySnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/seo-discovery", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Vyžaduje sa personál"
            : `Načítanie zlyhalo (${res.status})`,
        );
      }
      setData((await res.json()) as DiscoverySnapshot);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Načítanie zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = data
    ? (Object.keys(data.totals) as DiscoveryKind[]).map((kind) => ({
        kind,
        label: KIND_LABEL[kind],
        count: data.totals[kind],
      }))
    : [];

  return (
    <ToolShell
      title="SEO / AI discovery"
      eyebrow="Monitor · process-local"
      lead="Počítadlá hitov na llms.txt, sitemap a markdown detaily od štartu Node procesu. Trvalý záznam je v server logoch (`msg: seo-discovery`)."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outlined"
          disabled={busy}
          onClick={() => void load()}
          sx={{ borderRadius: 0 }}
        >
          {busy ? "Obnovujem…" : "Obnoviť"}
        </Button>
        <Button
          component="a"
          href="/llms.txt"
          target="_blank"
          rel="noreferrer"
          variant="contained"
          color="secondary"
          sx={{ borderRadius: 0 }}
        >
          Otvoriť llms.txt
        </Button>
        <Button
          component="a"
          href="/sitemap.xml"
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          sx={{ borderRadius: 0 }}
        >
          sitemap.xml
        </Button>
      </div>

      {data ? (
        <>
          <p className="font-mono text-[11px] text-muted-foreground">
            process od {new Date(data.processStartedAt).toLocaleString("sk-SK")}
            {" · "}
            snapshot {new Date(data.generatedAt).toLocaleTimeString("sk-SK")}
            {" · "}
            <span className="text-ink tabular-nums">{data.totalHits}</span> hitov
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((row) => (
              <ToolCard key={row.kind} title={row.label}>
                <p
                  className={cn(
                    "font-display text-3xl tabular-nums",
                    row.count > 0 ? "text-sage" : "text-muted-foreground",
                  )}
                >
                  {row.count}
                </p>
              </ToolCard>
            ))}
          </div>

          <ToolCard title={`Posledné hity · ${data.recent.length}`}>
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Zatiaľ žiadne — skús otvoriť /llms.txt alebo /sitemap.xml.
              </p>
            ) : (
              <ul className="divide-y divide-rule dark:divide-white/10">
                {data.recent.map((hit, index) => (
                  <li
                    key={`${hit.at}-${hit.path}-${index}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] tracking-wide text-sage uppercase">
                        {hit.kind}
                        {hit.status !== 200 ? ` · ${hit.status}` : ""}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {hit.path}
                      </p>
                      {hit.userAgent ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {hit.userAgent}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {new Date(hit.at).toLocaleTimeString("sk-SK")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ToolCard>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {busy ? "Načítavam…" : "Bez dát"}
        </p>
      )}
    </ToolShell>
  );
}
