import { useCallback, useEffect, useState } from "react";
import { ApiError, api, fmtTime } from "../lib/api";
import type { EmailConfig, OutboundEmail } from "../lib/api";
import { useAuth, errorMessage } from "../lib/auth";
import { Badge, Button, Empty, ErrorText, Icon, Input, Label, PageHeader, Skeleton, Table, Td, Textarea, cx } from "../components/ui";

const split = (s: string) =>
  s
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

const selectCls =
  "w-full rounded-xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-sm text-white transition focus:border-brand-400/60 focus:outline-none focus:ring-4 focus:ring-brand-400/10";

export default function Email() {
  const { me } = useAuth();
  const [cfg, setCfg] = useState<EmailConfig | null>(null);
  const [emails, setEmails] = useState<OutboundEmail[] | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHTML, setIsHTML] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [open, setOpen] = useState<OutboundEmail | null>(null);

  const load = useCallback(() => {
    api<{ emails: OutboundEmail[] }>("/admin/emails?limit=100")
      .then((r) => setEmails(r.emails))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    api<EmailConfig>("/admin/email/config")
      .then((c) => {
        setCfg(c);
        setFrom((f) => f || c.senders[0] || "");
      })
      .catch((e) => setError(errorMessage(e)));
    load();
  }, [load]);

  function reset() {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
  }

  function reuse(e: OutboundEmail) {
    setFrom(e.from);
    setTo(e.to.join(", "));
    setCc(e.cc.join(", "));
    setBcc(e.bcc.join(", "));
    setShowCc(e.cc.length + e.bcc.length > 0);
    setReplyTo(e.reply_to);
    setSubject(e.subject);
    setBody(e.body);
    setIsHTML(e.is_html);
    setOpen(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function send(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setSent("");
    const recipients = split(to);
    const total = recipients.length + split(cc).length + split(bcc).length;
    if (total > 1 && !window.confirm(`Send "${subject}" to ${total} recipients from ${from}?`)) return;
    setBusy(true);
    try {
      await api("/admin/emails", {
        method: "POST",
        body: { from, to: recipients, cc: split(cc), bcc: split(bcc), reply_to: replyTo, subject, body, is_html: isHTML },
      });
      setSent(`Sent to ${recipients.join(", ")}`);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
      load();
    }
  }

  return (
    <>
      <PageHeader
        title="Send email"
        description={
          <>
            Send from any <span className="text-ink-200">@verifynumber.in</span> address through Mailtrap. Every email is logged below.
          </>
        }
      />

      {cfg && !cfg.configured && (
        <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Email isn't configured on the server. Set <code className="font-mono">MAILTRAP_API_KEY</code> in the API
          environment and restart it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={send} className="panel space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="from">From</Label>
              {cfg ? (
                <select id="from" className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>
                  {cfg.senders.map((s) => (
                    <option key={s} value={s}>
                      {cfg.from_name} &lt;{s}&gt;
                    </option>
                  ))}
                </select>
              ) : (
                <Skeleton className="h-[42px]" />
              )}
            </div>
            <div>
              <Label htmlFor="reply">Reply-to (optional)</Label>
              <Input
                id="reply"
                type="email"
                placeholder={from || "replies go to the From address"}
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="to">To</Label>
              {!showCc && (
                <button type="button" onClick={() => setShowCc(true)} className="mb-1.5 text-xs text-brand-300 hover:text-brand-200">
                  Add Cc / Bcc
                </button>
              )}
            </div>
            <Input
              id="to"
              required
              placeholder="name@example.com, another@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {showCc && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cc">Cc</Label>
                <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bcc">Bcc</Label>
                <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Message</Label>
              <div className="mb-1.5 flex rounded-lg bg-white/[0.04] p-0.5 text-xs">
                {[
                  ["Plain text", false],
                  ["HTML", true],
                ].map(([l, v]) => (
                  <button
                    key={String(l)}
                    type="button"
                    onClick={() => setIsHTML(v as boolean)}
                    className={cx("rounded-md px-2.5 py-1", isHTML === v ? "bg-white/[0.1] text-white" : "text-ink-400 hover:text-white")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="body"
              required
              rows={12}
              className={isHTML ? "font-mono text-[13px]" : undefined}
              placeholder={isHTML ? "<p>Hello…</p>" : `Hi,\n\n…\n\nThanks,\n${me?.name ?? "VerifyNumber"}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-500">
              {isHTML ? "Sent as-is. Use inline styles." : "Sent with the VerifyNumber email layout. Blank lines start new paragraphs."}
            </p>
          </div>

          <ErrorText>{error}</ErrorText>
          {sent && (
            <p role="status" className="rounded-xl border border-brand-400/25 bg-brand-400/10 px-3.5 py-2.5 text-sm text-brand-200">
              {sent}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !cfg?.configured} className="flex-1 py-2.5">
              <Icon name="send" className="h-4 w-4" /> {busy ? "Sending…" : "Send email"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={busy}>
              Clear
            </Button>
          </div>
        </form>

        <div className="panel h-fit p-6">
          <p className="text-sm font-medium text-white">Preview</p>
          <div className="mt-3 space-y-1 text-xs text-ink-400">
            <p>
              <span className="text-ink-500">From:</span> {cfg?.from_name} &lt;{from}&gt;
            </p>
            <p className="break-all">
              <span className="text-ink-500">To:</span> {split(to).join(", ") || "—"}
            </p>
            {replyTo && (
              <p>
                <span className="text-ink-500">Reply-to:</span> {replyTo}
              </p>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl bg-white">
            {isHTML ? (
              <iframe title="preview" sandbox="" srcDoc={body} className="h-72 w-full" />
            ) : (
              <>
                <div className="bg-[#0b1220] px-4 py-2.5 text-sm font-semibold text-white">
                  Verify<span className="text-[#34d3a3]">Number</span>
                </div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed text-slate-800">
                  <p className="mb-2 font-semibold">{subject || "Subject"}</p>
                  {body || "Your message…"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-10 font-display text-lg font-semibold text-white">Sent emails</h2>
      {emails === null ? (
        <Skeleton className="h-40" />
      ) : emails.length === 0 ? (
        <div className="panel">
          <Empty>No emails sent yet.</Empty>
        </div>
      ) : (
        <Table head={["Time", "From", "To", "Subject", "Status", "Sent by", ""]}>
          {emails.map((e) => (
            <tr key={e.id}>
              <Td>{fmtTime(e.created_at)}</Td>
              <Td>{e.from}</Td>
              <Td className="max-w-[220px] truncate">
                {e.to.join(", ")}
                {e.cc.length + e.bcc.length > 0 && <span className="text-ink-500"> +{e.cc.length + e.bcc.length}</span>}
              </Td>
              <Td className="max-w-[260px] truncate text-white">{e.subject}</Td>
              <Td>
                {e.status === "sent" ? (
                  <Badge tone="green">Sent</Badge>
                ) : (
                  <span title={e.error}>
                    <Badge tone="red">Failed</Badge>
                  </span>
                )}
              </Td>
              <Td className="text-ink-500">{e.sent_by_email ?? "—"}</Td>
              <Td>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setOpen(e)}>
                  View
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(null)}>
          <div className="panel max-h-[85vh] w-full max-w-2xl overflow-auto p-6" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-white">{open.subject}</h3>
              <button onClick={() => setOpen(null)} aria-label="Close" className="text-ink-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-ink-400">
              <p>From: {open.from}</p>
              <p className="break-all">To: {open.to.join(", ")}</p>
              {open.cc.length > 0 && <p className="break-all">Cc: {open.cc.join(", ")}</p>}
              {open.bcc.length > 0 && <p className="break-all">Bcc: {open.bcc.join(", ")}</p>}
              {open.reply_to && <p>Reply-to: {open.reply_to}</p>}
              <p>
                {fmtTime(open.created_at)} · {open.status}
                {open.provider_message_id && ` · id ${open.provider_message_id}`}
              </p>
            </div>
            {open.error && <p className="mt-3 rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-200">{open.error}</p>}
            {open.is_html ? (
              <iframe title="email" sandbox="" srcDoc={open.body} className="mt-4 h-80 w-full rounded-xl bg-white" />
            ) : (
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-4 font-sans text-sm text-ink-200">{open.body}</pre>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => reuse(open)}>
                <Icon name="copy" className="h-4 w-4" /> Use as draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
