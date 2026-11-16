"use client";

import { useEffect, useMemo } from "react";
import { useGetList, useNotify } from "react-admin";
import { ToolShell } from "@/components/admin/tools/ToolShell";
import { WaitlistBoard } from "@/components/catalog/WaitlistBoard";
type BookRow = { id: string; title: string; author?: string };

export function WaitlistToolsPage() {
  const notify = useNotify();
  const getAccessToken = async () => null;
  const { data, isLoading, error } = useGetList<BookRow>("books", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "title", order: "ASC" },
  });

  useEffect(() => {
    if (error) {
      notify(
        error instanceof Error ? error.message : "Načítanie katalógu zlyhalo",
        { type: "error" },
      );
    }
  }, [error, notify]);

  const titles = useMemo(
    () =>
      new Map(
        (data ?? []).map((book) => [
          book.id,
          { id: book.id, title: book.title, author: book.author },
        ]),
      ),
    [data],
  );

  return (
    <ToolShell
      title="Čakací zoznam"
      eyebrow="Výpožičky · fronta"
      lead="Prehľad všetkých aktívnych položiek na čakacích zoznamoch. Odstránenie oslobodí miesto pre ďalšieho čitateľa."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Načítavam tituly…</p>
      ) : (
        <WaitlistBoard
          titles={titles}
          getAccessToken={getAccessToken}
          entraEnabled={false}
          heading="Fronta čakateľov"
        />
      )}
    </ToolShell>
  );
}