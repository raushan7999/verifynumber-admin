import { useCallback, useEffect, useState } from "react";
import { api, fmtTime } from "../lib/api";
import type { EnrollmentCode } from "../lib/api";
import { errorMessage } from "../lib/auth";
import { Badge, Button, Empty, ErrorText, Icon, Input, Label, PageHeader, Table, Td } from "../components/ui";

export default function Enrollment() {
  const [codes, setCodes] = useState<EnrollmentCode[] | null>(null);
  const [label, setLabel] = useState("");
  const [ttl, setTtl] = useState(24);
  const [fresh, setFresh] = useState<{ code: string; expires_at: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  const load = useCallback(() => {
    api<{ enrollment_codes: EnrollmentCode[] }>("/admin/enrollment-codes")
      .then((r) => {
        setCodes(r.enrollment_codes);
        setNow(Date.now());
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api<{ code: string; expires_at: string }>("/admin/enrollment-codes", {
        method: "POST",
        body: { label, ttl_hours: ttl },
      });
      setFresh(r);
      setCopied(false);
      setLabel("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Enrollment codes" description="One-time codes that connect a new gateway phone to VerifyNumber." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={create} className="panel space-y-4 p-6">
          <div>
            <Label htmlFor="label">Device label</Label>
            <Input id="label" placeholder="e.g. Rack A · Phone 3" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ttl">Valid for (hours)</Label>
            <Input id="ttl" type="number" min={1} max={720} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full py-2.5">
            <Icon name="key" className="h-4 w-4" /> {busy ? "Generating…" : "Generate code"}
          </Button>
        </form>

        <div className="panel flex flex-col justify-center p-6">
          {fresh ? (
            <div className="text-center">
              <p className="text-sm text-ink-400">Enter this in the VerifyNumber app on the gateway phone</p>
              <p className="my-4 select-all font-mono text-3xl font-semibold tracking-[0.18em] text-white">{fresh.code}</p>
              <Button
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(fresh.code).then(() => setCopied(true))}
              >
                <Icon name="copy" className="h-4 w-4" /> {copied ? "Copied" : "Copy code"}
              </Button>
              <p className="mt-4 text-xs text-ink-500">Single use · expires {fmtTime(fresh.expires_at)} · shown only once</p>
            </div>
          ) : (
            <ol className="space-y-3 text-sm text-ink-300">
              {[
                "Generate a code here.",
                "Install the VerifyNumber app on an Android phone with the SIM card(s).",
                "Enter the code, then allow SMS, phone and notification permissions.",
                "Set battery to Unrestricted. SIMs appear as available within a minute.",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-400/15 text-xs font-semibold text-brand-300">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-10 font-display text-lg font-semibold text-white">Recent codes</h2>
      {codes?.length === 0 ? (
        <div className="panel">
          <Empty>No codes generated yet.</Empty>
        </div>
      ) : (
        <Table head={["Label", "Created", "Expires", "Status", "Device"]}>
          {codes?.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium text-white">{c.label}</Td>
              <Td>{fmtTime(c.created_at)}</Td>
              <Td>{fmtTime(c.expires_at)}</Td>
              <Td>
                {c.used_at ? (
                  <Badge tone="green">Used</Badge>
                ) : new Date(c.expires_at).getTime() < now ? (
                  <Badge>Expired</Badge>
                ) : (
                  <Badge tone="amber">Unused</Badge>
                )}
              </Td>
              <Td>{c.device_name ? `${c.device_name} (#${c.device_id})` : "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
