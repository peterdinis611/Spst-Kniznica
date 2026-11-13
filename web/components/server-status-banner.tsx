"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { API_BASE, apiUrl } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Reachability = "unknown" | "online" | "offline";

const POLL_MS = 8_000;
const TIMEOUT_MS = 3_000;

async function probeGateway(): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl("/health"), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function ServerStatusBanner() {
  const [status, setStatus] = useState<Reachability>("unknown");
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    setChecking(true);
    const ok = await probeGateway();
    if (!mounted.current) return;
    setStatus(ok ? "online" : "offline");
    setChecking(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();

    const id = window.setInterval(() => {
      void check();
    }, POLL_MS);

    const onOnline = () => {
      void check();
    };
    const onOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [check]);

  if (status !== "offline") return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 border-b border-rule bg-surface-inverse text-paper"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 md:px-8">
        <p className="min-w-0 text-[12px] leading-snug sm:text-[13px]">
          <span className="mr-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
            <WifiOff className="size-3.5" strokeWidth={2} aria-hidden />
            Offline
          </span>
          <span className="text-paper/85">
            Server nie je dostupný ({API_BASE}). Katalóg a výpožičky môžu
            dočasne nefungovať.
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 shrink-0 rounded-none border-paper/30 bg-transparent px-3 text-paper",
            "hover:bg-paper/10 hover:text-paper",
          )}
          onClick={() => {
            void check();
          }}
          disabled={checking}
        >
          <RefreshCw
            className={cn("size-3.5", checking && "animate-spin")}
            strokeWidth={1.8}
            aria-hidden
          />
          Skúsiť znova
        </Button>
      </div>
    </div>
  );
}
