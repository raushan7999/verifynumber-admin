import { useCallback, useEffect, useState } from "react";
import { api, fmtTime } from "../lib/api";
import type { InboundMessage } from "../lib/api";
import { errorMessage } from "../lib/auth";
import { Badge, Button, Empty, ErrorText, Icon, PageHeader, Table, Td } from "../components/ui";

const PAGE = 100;

export default function Messages() {
  const [rows, setRows] = useState<InboundMessage[] | null>(null);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);

  const load = useCallback((before?: number) => {
    api<{ messages: InboundMessage[] }>(`/admin/messages?limit=${PAGE}${before ? `&before=${before}` : ""}`)
      .then((r) => {
        setRows((prev) => (before && prev ? [...prev, ...r.messages] : r.messages));
        setMore(r.messages.length === PAGE);
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 10000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Inbound messages"
        description="Every SMS forwarded by gateway phones. Unmatched messages are stored but trigger nothing."
        actions={
          <Button variant="secondary" onClick={() => load()}>
            <Icon name="refresh" className="h-4 w-4" /> Refresh
          </Button>
        }
      />
      {error && (
        <div className="mb-6">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      {rows?.length === 0 ? (
        <div className="panel">
          <Empty>No messages received yet.</Empty>
        </div>
      ) : (
        <Table head={["Received", "From", "To SIM", "Message", "Match"]}>
          {rows?.map((m) => (
            <tr key={m.id} className="transition hover:bg-white/[0.02]">
              <Td>{fmtTime(m.received_at)}</Td>
              <Td className="font-mono text-xs text-white">{m.sender_e164 ?? m.sender}</Td>
              <Td className="font-mono text-xs">{m.sim_phone ?? `device ${m.device_id} · sub ${m.subscription_id}`}</Td>
              <Td className="max-w-xs truncate text-ink-200">{m.body}</Td>
              <Td>{m.verification_id ? <Badge tone="green">Verified</Badge> : <Badge>Unmatched</Badge>}</Td>
            </tr>
          ))}
        </Table>
      )}
      {rows && more && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={() => load(rows[rows.length - 1].id)}>
            Load older
          </Button>
        </div>
      )}
    </>
  );
}
