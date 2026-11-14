"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttpDownload } from "@/lib/admin/http";
import { withQuery } from "@/lib/api/client";

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
  const [busy, setBusy] = useState<"csv" | "xml" | null>(null);

  async function download(format: "csv" | "xml") {
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
      <Button
        size="small"
        disabled={busy !== null}
        onClick={() => void download("csv")}
        sx={{ borderRadius: 0 }}
      >
        {busy === "csv" ? "CSV…" : "CSV"}
      </Button>
      <Button
        size="small"
        disabled={busy !== null}
        onClick={() => void download("xml")}
        sx={{ borderRadius: 0 }}
      >
        {busy === "xml" ? "XML…" : "XML"}
      </Button>
    </>
  );
}
