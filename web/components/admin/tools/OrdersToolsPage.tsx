"use client";

import { useCallback, useEffect, useState } from "react";
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

type QueueStatus = {
  pendingCount: number;
  queue: string;
  jobName: string;
};

export function OrdersToolsPage() {
  const notify = useNotify();
  const [orderId, setOrderId] = useState(() => `admin-${Date.now()}`);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<EnqueueResult | null>(null);
  const [queue, setQueue] = useState<QueueStatus | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const status = await adminHttp<QueueStatus>("/api/orders/queue");
      setQueue(status);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Stav fronty zlyhal", {
        type: "error",
      });
    }
  }, [notify]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

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
      await loadQueue();
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
      lead="Stav fronty (GET /api/orders/queue) a zaradenie testovacej úlohy."
    >
      <ToolCard title="Stav fronty">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => void loadQueue()}
            sx={{ borderRadius: 0 }}
          >
            Obnoviť
          </Button>
        </div>
        {queue ? (
          <dl className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
            <div>pendingCount: {queue.pendingCount}</div>
            <div>queue: {queue.queue}</div>
            <div>jobName: {queue.jobName}</div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Bez dát</p>
        )}
      </ToolCard>

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
