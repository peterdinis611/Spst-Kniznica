"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttpDownload } from "@/lib/admin/http";
import { withQuery } from "@/lib/api/client";

type ExportFormat = "csv" | "xml" | "xlsx" | "pdf";

const FORMATS: ExportFormat[] = ["csv", "xml", "xlsx", "pdf"];

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ServerExportButtons({
  path,
  fileStem,
}: {
  path: string;
  fileStem: string;
}) {
  const notify = useNotify();
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  async function download(format: ExportFormat) {
    setBusy(format);
    try {
      const url = withQuery(path, { format, take: 2000 });
      const { blob, fileName } = await adminHttpDownload(
        url,
        `${fileStem}.${format}`,
      );
      triggerDownload(blob, fileName);
      notify(`Export ${format.toUpperCase()} hotový`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Export zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {FORMATS.map((format) => (
        <Button
          key={format}
          size="small"
          disabled={busy !== null}
          onClick={() => void download(format)}
          sx={{ borderRadius: 0 }}
        >
          {busy === format ? `${format.toUpperCase()}…` : format.toUpperCase()}
        </Button>
      ))}
    </>
  );
}
