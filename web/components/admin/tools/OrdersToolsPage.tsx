"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type EnqueueResult = {
  accepted: boolean;
  jobId: string;
  orderId: string;
  queue: string;
  name: string;
};

export function OrdersToolsPage() {
  const notify = useNotify();
  const [orderId, setOrderId] = useState(() => `admin-${Date.now()}`);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<EnqueueResult | null>(null);

  async function enqueue() {
    if (!orderId.trim()) {
      notify("orderId je povinné", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      const result = await adminHttp<EnqueueResult>(
        "/api/orders/enqueue",
        { method: "POST" },
        { orderId: orderId.trim() },
      );
      setLast(result);
      notify(`Job ${result.jobId} zaradený`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Zaradenie do fronty zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Fronta úloh / objednávky"
      eyebrow="WorkersService · fronta"
      lead="Zaradenie testovacej úlohy do fronty objednávok (diagnostika workerov)."
    >
      <ToolCard title="Zaradiť do fronty">
        <TextField
          size="small"
          fullWidth
          label="ID objednávky"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <Button
          variant="contained"
          color="secondary"
          disabled={busy}
          onClick={() => void enqueue()}
          sx={{ mt: 2, borderRadius: 0 }}
        >
          {busy ? "Zaraďujem…" : "Zaradiť job"}
        </Button>
        {last ? (
          <dl className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
            <div>jobId: {last.jobId}</div>
            <div>orderId: {last.orderId}</div>
            <div>
              queue: {last.queue} · {last.name}
            </div>
          </dl>
        ) : null}
      </ToolCard>
    </ToolShell>
  );
}
