"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "next-safe-action/hooks";

type CursorResult<TItem> = {
  items: TItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ExecutableAction<TInput extends object> = (
  input: TInput,
) => Promise<unknown> | unknown;

/**
 * Debounced first-page fetch + imperative loadMore for cursor/keyset catalogs.
 */
export function useCursorCatalog<
  TItem extends { id: string },
  TInput extends { cursor?: string; limit?: number },
>(
  action: ExecutableAction<TInput>,
  baseInput: Omit<TInput, "cursor">,
  initialItems: TItem[],
  delayMs = 220,
) {
  const { executeAsync, isPending } = useAction(
    action as Parameters<typeof useAction>[0],
  );
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const filterKey = JSON.stringify(baseInput);
  const baseInputRef = useRef(baseInput);
  baseInputRef.current = baseInput;
  const first = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const run = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const payload = {
          ...baseInputRef.current,
          cursor: undefined,
        } as TInput;
        const result = (await executeAsync(payload)) as
          | { data?: CursorResult<TItem> }
          | undefined;
        const data = result?.data;
        if (!data) return;
        setItems(data.items);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } finally {
        inFlight.current = false;
      }
    };

    if (first.current) {
      first.current = false;
      void run();
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void run();
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filterKey, executeAsync, delayMs]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || isPending || inFlight.current) {
      return;
    }
    inFlight.current = true;
    setLoadingMore(true);
    try {
      const payload = {
        ...baseInputRef.current,
        cursor: nextCursor,
      } as TInput;
      const result = (await executeAsync(payload)) as
        | { data?: CursorResult<TItem> }
        | undefined;
      const data = result?.data;
      if (!data) return;
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const appended = data.items.filter((item) => !seen.has(item.id));
        return appended.length ? [...prev, ...appended] : prev;
      });
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      inFlight.current = false;
      setLoadingMore(false);
    }
  }, [executeAsync, hasMore, isPending, loadingMore, nextCursor]);

  return {
    items,
    hasMore,
    isPending,
    loadingMore,
    loadMore,
  };
}
