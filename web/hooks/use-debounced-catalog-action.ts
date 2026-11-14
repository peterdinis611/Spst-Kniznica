"use client";

import { useEffect, useRef } from "react";
import { useAction } from "next-safe-action/hooks";
import { useDebouncedCallback } from "@tanstack/react-pacer";

export function useDebouncedCatalogAction<TInput extends object, TData>(
  // next-safe-action generics are deep; cast at the boundary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => any,
  input: TInput,
  delayMs = 220,
): {
  data: TData | undefined;
  serverError: string | undefined;
  isPending: boolean;
} {
  const { execute, result, isPending } = useAction(action);
  const first = useRef(true);
  const inputKey = JSON.stringify(input);

  const runDebounced = useDebouncedCallback(
    (payload: TInput) => {
      execute(payload);
    },
    { wait: delayMs },
  );

  useEffect(() => {
    const payload = JSON.parse(inputKey) as TInput;

    if (first.current) {
      first.current = false;
      execute(payload);
      return;
    }

    runDebounced(payload);
  }, [inputKey, execute, runDebounced]);

  return {
    data: result.data as TData | undefined,
    serverError: result.serverError as string | undefined,
    isPending,
  };
}
