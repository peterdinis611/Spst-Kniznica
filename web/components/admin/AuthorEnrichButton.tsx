"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import { useFormContext } from "react-hook-form";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";
import { withQuery } from "@/lib/api/client";

type AuthorEnrichmentResult = {
  query: string;
  name?: string | null;
  biography?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  wikidataId?: string | null;
  viafId?: string | null;
  profileUrl?: string | null;
  source?: string;
};

export function AuthorEnrichButton() {
  const notify = useNotify();
  const { getValues, setValue } = useFormContext();
  const [busy, setBusy] = useState(false);

  async function enrich() {
    const name = String(getValues("name") ?? "").trim();
    if (!name) {
      notify("Najprv zadaj meno autora", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      const data = await adminHttp<AuthorEnrichmentResult>(
        withQuery("/api/authors/enrich", { q: name }),
      );
      if (data.name) setValue("name", data.name, { shouldDirty: true });
      if (data.biography) {
        setValue("biography", data.biography, { shouldDirty: true });
      }
      if (data.nationality) {
        setValue("nationality", data.nationality, { shouldDirty: true });
      }
      if (data.birthYear != null) {
        setValue("birthYear", data.birthYear, { shouldDirty: true });
      }
      if (data.wikidataId) {
        setValue("wikidataId", data.wikidataId, { shouldDirty: true });
      }
      if (data.viafId) setValue("viafId", data.viafId, { shouldDirty: true });
      if (data.profileUrl) {
        setValue("profileUrl", data.profileUrl, { shouldDirty: true });
      }
      notify(`Doplnené z ${data.source ?? "Wikidata"}`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Enrichment zlyhal", {
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
      onClick={() => void enrich()}
      sx={{ borderRadius: 0, mt: 1 }}
    >
      {busy ? "Hľadám…" : "Doplniť z Wikidata / VIAF"}
    </Button>
  );
}
