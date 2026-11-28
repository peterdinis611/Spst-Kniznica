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
  bodyText?: string | null;
  bodyHtml?: string | null;
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
  const [detail, setDetail] = useState<EmailMessage | null>(null);
  const [to, setTo] = useState("test@spst.sk");
  const [bookTitle, setBookTitle] = useState("Testovací titul");
  const [composeTo, setComposeTo] = useState("");
  const [composeName, setComposeName] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTemplate, setComposeTemplate] = useState("");

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

  async function openDetail(id: string) {
    setBusy(true);
    try {
      setDetail(await adminHttp<EmailMessage>(`/api/emails/${id}`));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Detail zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

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

  async function sendCompose() {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      notify("Vyplň príjemcu, predmet a text", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      await adminHttp(
        "/api/emails/send",
        { method: "POST" },
        {
          to: composeTo.trim(),
          toName: composeName.trim() || null,
          subject: composeSubject.trim(),
          bodyText: composeBody.trim(),
          templateKey: composeTemplate.trim() || null,
        },
      );
      notify("E-mail odoslaný", { type: "success" });
      setComposeSubject("");
      setComposeBody("");
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Odoslanie zlyhalo", {
        type: "error",
      });
      setBusy(false);
    }
  }

  async function sendTemplate(
    kind:
      | "loan-borrowed"
      | "loan-returned"
      | "loan-due-reminder"
      | "waitlist-promotion",
  ) {
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
      lead="Stav, vlastná správa, detail, opätovné odoslanie a test šablón výpožičiek."
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

      <ToolCard title="Napísať e-mail">
        <div className="grid gap-2 sm:grid-cols-2">
          <TextField
            size="small"
            fullWidth
            label="Príjemca"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
          <TextField
            size="small"
            fullWidth
            label="Meno príjemcu"
            value={composeName}
            onChange={(e) => setComposeName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
        </div>
        <TextField
          size="small"
          fullWidth
          label="Predmet"
          value={composeSubject}
          onChange={(e) => setComposeSubject(e.target.value)}
          sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={4}
          label="Text"
          value={composeBody}
          onChange={(e) => setComposeBody(e.target.value)}
          sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <TextField
          size="small"
          fullWidth
          label="Template key (voliteľné)"
          value={composeTemplate}
          onChange={(e) => setComposeTemplate(e.target.value)}
          sx={{ mt: 2, mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        <Button
          variant="contained"
          color="secondary"
          disabled={busy}
          onClick={() => void sendCompose()}
          sx={{ borderRadius: 0 }}
        >
          Odoslať
        </Button>
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
            onClick={() => void sendTemplate("loan-borrowed")}
            sx={{ borderRadius: 0 }}
          >
            Požičanie
          </Button>
          <Button
            variant="outlined"
            disabled={busy || !to.trim()}
            onClick={() => void sendTemplate("loan-returned")}
            sx={{ borderRadius: 0 }}
          >
            Vrátenie
          </Button>
          <Button
            variant="outlined"
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
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => void openDetail(msg.id)}
                >
                  <p className="truncate text-sm text-ink hover:text-sage">
                    {msg.subject}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {msg.toAddress} ·{" "}
                    {STATUS_LABEL[String(msg.status)] ?? String(msg.status)}
                    {msg.templateKey ? ` · ${msg.templateKey}` : ""}
                  </p>
                  {msg.error ? (
                    <p className="mt-1 text-xs text-stair-2">{msg.error}</p>
                  ) : null}
                </button>
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

      {detail ? (
        <ToolCard title={`Detail · ${detail.id}`}>
          <dl className="space-y-1 font-mono text-xs text-muted-foreground">
            <div>
              to: {detail.toAddress}
              {detail.toName ? ` (${detail.toName})` : ""}
            </div>
            <div>subject: {detail.subject}</div>
            <div>
              status: {STATUS_LABEL[String(detail.status)] ?? String(detail.status)}
            </div>
            <div>
              created: {new Date(detail.createdAt).toLocaleString("sk-SK")}
            </div>
            {detail.sentAt ? (
              <div>sent: {new Date(detail.sentAt).toLocaleString("sk-SK")}</div>
            ) : null}
            {detail.templateKey ? <div>template: {detail.templateKey}</div> : null}
            {detail.correlationId ? (
              <div>correlation: {detail.correlationId}</div>
            ) : null}
            {detail.error ? (
              <div className="text-stair-2">error: {detail.error}</div>
            ) : null}
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="small"
              variant="outlined"
              disabled={busy}
              onClick={() => void resend(detail.id)}
              sx={{ borderRadius: 0 }}
            >
              Znova odoslať
            </Button>
            <Button
              size="small"
              onClick={() => setDetail(null)}
              sx={{ borderRadius: 0 }}
            >
              Zavrieť
            </Button>
          </div>
        </ToolCard>
      ) : null}
    </ToolShell>
  );
}
