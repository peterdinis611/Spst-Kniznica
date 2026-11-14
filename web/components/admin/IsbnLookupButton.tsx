"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import { useFormContext } from "react-hook-form";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";

type IsbnLookupResult = {
  isbn: string;
  title?: string | null;
  subtitle?: string | null;
  authors?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  language?: string | null;
  pageCount?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  source?: string;
};

export function IsbnLookupButton() {
  const notify = useNotify();
  const { getValues, setValue } = useFormContext();
  const [busy, setBusy] = useState(false);

  async function lookup() {
    const isbn = String(getValues("isbn") ?? "").trim();
    if (!isbn) {
      notify("Najprv zadaj ISBN", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      const data = await adminHttp<IsbnLookupResult>(
        `/api/books/lookup/isbn/${encodeURIComponent(isbn)}`,
      );
      if (data.title) setValue("title", data.title, { shouldDirty: true });
      if (data.subtitle) setValue("subtitle", data.subtitle, { shouldDirty: true });
      if (data.publisher) setValue("publisher", data.publisher, { shouldDirty: true });
      if (data.publishedYear != null) {
        setValue("publishedYear", data.publishedYear, { shouldDirty: true });
      }
      if (data.language) setValue("language", data.language, { shouldDirty: true });
      if (data.pageCount != null) {
        setValue("pageCount", data.pageCount, { shouldDirty: true });
      }
      if (data.description) {
        setValue("description", data.description, { shouldDirty: true });
      }
      if (data.coverUrl) setValue("coverUrl", data.coverUrl, { shouldDirty: true });
      if (data.isbn) setValue("isbn", data.isbn, { shouldDirty: true });
      notify(`Načítané z ${data.source ?? "Open Library"}`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "ISBN lookup zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="small"
      variant="outlined"
      disabled={busy}
      onClick={() => void lookup()}
      sx={{ borderRadius: 0, mt: 1 }}
    >
      {busy ? "Hľadám…" : "Načítať z Open Library"}
    </Button>
  );
}
