"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type EmailStatus = {
  smtpEnabled: boolean;
  fromAddress: string;
  host: string;
  port: number;
  recentCount: number;
};

type EmailMessage = {
  id: string;
  toAddress: string;
  toName?: string | null;
  subject: string;
  templateKey?: string | null;
  correlationId?: string | null;
  status: number | string;
  error?: string | null;
  createdAt: string;
  sentAt?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  "0": "Queued",
  "1": "Sent",
  "2": "Failed",
  "3": "LoggedOnly",
  Queued: "Queued",
  Sent: "Sent",
  Failed: "Failed",
  LoggedOnly: "LoggedOnly",
};

export function EmailsToolsPage() {
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [to, setTo] = useState("test@spst.sk");
  const [bookTitle, setBookTitle] = useState("Testovací titul");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [nextStatus, nextMessages] = await Promise.all([
        adminHttp<EmailStatus>("/api/emails/status"),
        adminHttp<EmailMessage[]>("/api/emails?take=40"),
      ]);
      setStatus(nextStatus);
      setMessages(nextMessages);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Načítanie e-mailov zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resend(id: string) {
    setBusy(true);
    try {
      await adminHttp(`/api/emails/${id}/resend`, { method: "POST" }, {});
      notify("E-mail znova zaradený", { type: "success" });
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Opätovné odoslanie zlyhalo", {
        type: "error",
      });
      setBusy(false);
    }
  }

  async function sendTemplate(kind: "loan-due-reminder" | "waitlist-promotion") {
    setBusy(true);
    try {
      const bookingId = crypto.randomUUID();
      const bookId = crypto.randomUUID();
      await adminHttp(
        `/api/emails/templates/${kind}`,
        { method: "POST" },
        {
          bookingId,
          bookId,
          borrowerEmail: to.trim(),
          borrowerName: "Test čitateľ",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          bookTitle: bookTitle.trim() || "titul",
        },
      );
      notify(`Šablóna ${kind} odoslaná`, { type: "success" });
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Test šablóny zlyhal", {
        type: "error",
      });
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="E-maily"
      eyebrow="EmailService · SMTP / log-only"
      lead="Stav odosielania, posledné správy, opätovné odoslanie a test šablón výpožičiek."
    >
      <ToolCard title="Stav služby">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => void load()}
            sx={{ borderRadius: 0 }}
          >
            Obnoviť
          </Button>
        </div>
        {status ? (
          <dl className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
            <div>smtp: {status.smtpEnabled ? "enabled" : "log-only"}</div>
            <div>
              from: {status.fromAddress} · {status.host}:{status.port}
            </div>
            <div>recentCount: {status.recentCount}</div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {busy ? "Načítavam…" : "Bez dát"}
          </p>
        )}
      </ToolCard>

      <ToolCard title="Test šablón">
        <TextField
          size="small"
          fullWidth
          label="Príjemca"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <TextField
          size="small"
          fullWidth
          label="Názov knihy"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="contained"
            color="secondary"
            disabled={busy || !to.trim()}
            onClick={() => void sendTemplate("loan-due-reminder")}
            sx={{ borderRadius: 0 }}
          >
            Pripomienka termínu
          </Button>
          <Button
            variant="outlined"
            disabled={busy || !to.trim()}
            onClick={() => void sendTemplate("waitlist-promotion")}
            sx={{ borderRadius: 0 }}
          >
            Waitlist ready
          </Button>
        </div>
      </ToolCard>

      <ToolCard title="Posledné správy">
        <ul className="divide-y divide-rule dark:divide-white/10">
          {messages.length === 0 ? (
            <li className="py-2 text-sm text-muted-foreground">Žiadne správy.</li>
          ) : (
            messages.map((msg) => (
              <li
                key={msg.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{msg.subject}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {msg.toAddress} ·{" "}
                    {STATUS_LABEL[String(msg.status)] ?? String(msg.status)}
                    {msg.templateKey ? ` · ${msg.templateKey}` : ""}
                  </p>
                  {msg.error ? (
                    <p className="mt-1 text-xs text-stair-2">{msg.error}</p>
                  ) : null}
                </div>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={busy}
                  onClick={() => void resend(msg.id)}
                  sx={{ borderRadius: 0 }}
                >
                  Znova
                </Button>
              </li>
            ))
          )}
        </ul>
      </ToolCard>
    </ToolShell>
  );
}
