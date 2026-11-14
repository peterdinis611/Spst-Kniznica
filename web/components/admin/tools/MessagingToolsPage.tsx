"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type MessagingStatus = {
  application: string;
  kafkaEnabled: boolean;
  rabbitMqEnabled: boolean;
  kafkaBootstrap?: string;
  rabbitHost?: string;
};

type PublishResult = {
  eventId: string;
  eventType: string;
  transports: string[];
};

export function MessagingToolsPage() {
  const notify = useNotify();
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [target, setTarget] = useState("all");
  const [message, setMessage] = useState("Admin ping zo SPST pultu");
  const [source, setSource] = useState("spst-admin");
  const [last, setLast] = useState<PublishResult | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await adminHttp<MessagingStatus>("/api/messaging/status"));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Status zlyhal", {
        type: "error",
      });
    }
  }, [notify]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function publish() {
    setBusy(true);
    try {
      const result = await adminHttp<PublishResult>(
        "/api/messaging/publish",
        { method: "POST" },
        { target, source, message },
      );
      setLast(result);
      notify(`Publikované: ${result.transports.join(", ")}`, {
        type: "success",
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Publish zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Messaging"
      eyebrow="Kafka · RabbitMQ"
      lead="Stav brokerov a manuálny ping event pre diagnostiku fronty."
    >
      <ToolCard title="Stav">
        {status ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Kafka</dt>
              <dd className={status.kafkaEnabled ? "text-sage" : "text-stair-2"}>
                {status.kafkaEnabled ? "enabled" : "off"} ·{" "}
                <span className="font-mono text-xs">
                  {status.kafkaBootstrap ?? "—"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">RabbitMQ</dt>
              <dd
                className={
                  status.rabbitMqEnabled ? "text-sage" : "text-stair-2"
                }
              >
                {status.rabbitMqEnabled ? "enabled" : "off"} ·{" "}
                <span className="font-mono text-xs">
                  {status.rabbitHost ?? "—"}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Načítavam…</p>
        )}
      </ToolCard>

      <ToolCard title="Publish ping">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            select
            size="small"
            label="Target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          >
            <MenuItem value="all">all</MenuItem>
            <MenuItem value="kafka">kafka</MenuItem>
            <MenuItem value="rabbitmq">rabbitmq</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
          <TextField
            size="small"
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
        </div>
        <Button
          variant="contained"
          color="secondary"
          disabled={busy}
          onClick={() => void publish()}
          sx={{ mt: 2, borderRadius: 0 }}
        >
          {busy ? "Posielam…" : "Publish"}
        </Button>
        {last ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {last.eventType} · {last.eventId}
            <br />
            transports: {last.transports.join(", ")}
          </p>
        ) : null}
      </ToolCard>
    </ToolShell>
  );
}
