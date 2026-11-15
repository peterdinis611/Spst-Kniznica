"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AnnounceFn = (message: string, politeness?: "polite" | "assertive") => void;

const LiveAnnouncerContext = createContext<AnnounceFn>(() => undefined);

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  const announce = useCallback<AnnounceFn>((message, politeness = "polite") => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (politeness === "assertive") {
      setAssertive("");
      requestAnimationFrame(() => setAssertive(trimmed));
      return;
    }

    setPolite("");
    requestAnimationFrame(() => setPolite(trimmed));
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useAnnounce(): AnnounceFn {
  return useContext(LiveAnnouncerContext);
}
