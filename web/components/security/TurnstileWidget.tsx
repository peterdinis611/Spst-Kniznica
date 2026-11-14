"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function isTurnstileConfigured() {
  return SITE_KEY.length > 0;
}

export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) {
      onToken(null);
      return;
    }

    let cancelled = false;

    function mount() {
      if (cancelled || !ref.current || !window.turnstile) return;
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
      });
    }

    const existing = document.querySelector(
      'script[data-spst-turnstile="1"]',
    ) as HTMLScriptElement | null;

    if (window.turnstile) {
      mount();
    } else if (existing) {
      existing.addEventListener("load", mount);
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.spstTurnstile = "1";
      script.addEventListener("load", mount);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return <div ref={ref} className="mt-4" />;
}
