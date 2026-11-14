"use client";

import { useEffect, useRef } from "react";
import { useAction } from "next-safe-action/hooks";

type ExecutableAction<TInput extends object> = (
  input: TInput,
) => Promise<unknown> | unknown;

/**
 * Debounced wrapper around next-safe-action hooks.
 * Keeps the action boundary typed without leaking `any`.
 */
export function useDebouncedCatalogAction<TInput extends object, TData>(
  action: ExecutableAction<TInput>,
  input: TInput,
  delayMs = 220,
): {
  data: TData | undefined;
  serverError: string | undefined;
  isPending: boolean;
} {
  // useAction expects a SafeAction; cast only at this framework boundary.
  const { execute, result, isPending } = useAction(
    action as Parameters<typeof useAction>[0],
  );
  const first = useRef(true);
  const inputKey = JSON.stringify(input);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const payload = JSON.parse(inputKey) as TInput;

    if (first.current) {
      first.current = false;
      execute(payload);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      execute(payload);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputKey, execute, delayMs]);

  return {
    data: result.data as TData | undefined,
    serverError:
      typeof result.serverError === "string" ? result.serverError : undefined,
    isPending,
  };
}
