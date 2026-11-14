"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { adminHttp, adminQuery } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type CacheStatus = {
  application: string;
  enabled: boolean;
  connection?: string;
  instanceName?: string;
  defaultTtlSeconds?: number;
};

type CacheEntry = {
  key: string;
  found: boolean;
  value?: unknown;
};

export function CacheToolsPage() {
  const notify = useNotify();
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [pattern, setPattern] = useState("*");
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [entry, setEntry] = useState<CacheEntry | null>(null);
  const [prefix, setPrefix] = useState("books:");
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await adminHttp<CacheStatus>("/api/cache/status"));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Status zlyhal", {
        type: "error",
      });
    }
  }, [notify]);

  const loadKeys = useCallback(async () => {
    setBusy(true);
    try {
      const list = await adminHttp<string[]>(
        adminQuery("/api/cache/keys", { pattern: pattern || undefined }),
      );
      setKeys(list ?? []);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Keys zlyhali", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify, pattern]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function inspectKey(key: string) {
    setSelectedKey(key);
    try {
      const data = await adminHttp<CacheEntry>(
        `/api/cache/${encodeURIComponent(key)}`,
      );
      setEntry(data);
    } catch (err) {
      setEntry(null);
      notify(err instanceof Error ? err.message : "Kľúč nenájdený", {
        type: "warning",
      });
    }
  }

  async function deleteKey(key: string) {
    if (!window.confirm(`Zmazať cache kľúč „${key}“?`)) return;
    try {
      await adminHttp(`/api/cache/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      notify("Kľúč zmazaný", { type: "info" });
      setEntry(null);
      await loadKeys();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Mazanie zlyhalo", {
        type: "error",
      });
    }
  }

  async function flushPrefix() {
    if (!prefix.trim()) return;
    if (!window.confirm(`Zmazať všetky kľúče s prefixom „${prefix}“?`)) return;
    try {
      await adminHttp(adminQuery("/api/cache", { prefix }), {
        method: "DELETE",
      });
      notify(`Prefix ${prefix} vyčistený`, { type: "info" });
      await loadKeys();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Flush zlyhal", {
        type: "error",
      });
    }
  }

  return (
    <ToolShell
      title="Cache"
      eyebrow="CacheService · Redis"
      lead="Prehliadanie kľúčov, detail hodnoty a mazanie podľa prefixu. Staff only."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ToolCard title="Stav">
          {status ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Enabled</dt>
                <dd className={status.enabled ? "text-sage" : "text-stair-2"}>
                  {status.enabled ? "áno" : "nie"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Instance</dt>
                <dd className="font-mono text-xs">{status.instanceName ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">TTL</dt>
                <dd className="font-mono text-xs">
                  {status.defaultTtlSeconds ?? "—"}s
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Načítavam…</p>
          )}
          <Button
            size="small"
            variant="outlined"
            onClick={() => void loadStatus()}
            sx={{ mt: 2, borderRadius: 0 }}
          >
            Obnoviť
          </Button>
        </ToolCard>

        <ToolCard title="Flush podľa prefixu">
          <TextField
            size="small"
            fullWidth
            label="Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
          <Button
            color="error"
            variant="outlined"
            onClick={() => void flushPrefix()}
            sx={{ mt: 2, borderRadius: 0 }}
          >
            Zmazať prefix
          </Button>
        </ToolCard>
      </div>

      <ToolCard title="Kľúče">
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextField
            size="small"
            fullWidth
            label="Pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            helperText="napr. * alebo books:*"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
          <Button
            variant="contained"
            color="secondary"
            disabled={busy}
            onClick={() => void loadKeys()}
            sx={{ borderRadius: 0, whiteSpace: "nowrap" }}
          >
            {busy ? "Hľadám…" : "Načítať"}
          </Button>
        </div>
        {keys.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Žiadne kľúče (alebo ešte nebolo načítané).
          </p>
        ) : (
          <ul className="mt-3 max-h-72 divide-y divide-rule overflow-auto border border-rule dark:divide-white/10 dark:border-white/10">
            {keys.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  className="min-w-0 truncate text-left font-mono text-xs hover:text-sage"
                  onClick={() => void inspectKey(key)}
                >
                  {key}
                </button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => void deleteKey(key)}
                  sx={{ borderRadius: 0, minWidth: 0 }}
                >
                  Del
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ToolCard>

      {entry ? (
        <ToolCard title={`Hodnota · ${selectedKey}`}>
          <pre className="max-h-80 overflow-auto bg-paper-deep/80 p-3 font-mono text-xs text-ink dark:bg-black/30">
            {JSON.stringify(entry.value, null, 2)}
          </pre>
        </ToolCard>
      ) : null}
    </ToolShell>
  );
}
