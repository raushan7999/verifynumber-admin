import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fmtNumber, timeAgo } from "../lib/api";
import type { Device, Overview, SimState } from "../lib/api";
import { errorMessage } from "../lib/auth";
import { Badge, Button, Empty, ErrorText, Icon, PageHeader, Skeleton, Stat, stateTone } from "../components/ui";

export default function Devices() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [stats, setStats] = useState<Overview | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all([api<{ devices: Device[] }>("/admin/devices"), api<Overview>("/admin/overview")])
      .then(([d, o]) => {
        setDevices(d.devices);
        setStats(o);
        setNow(Date.now());
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // Live status: refresh every 5s while the tab is visible.
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  async function toggleSim(sim: SimState) {
    if (sim.admin_enabled && sim.pending > 0 && !window.confirm(`Disable this SIM? ${sim.pending} pending verification(s) on it will be marked failed.`)) return;
    try {
      await api(`/admin/sims/${sim.id}`, { method: "PATCH", body: { admin_enabled: !sim.admin_enabled } });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function revoke(d: Device) {
    if (!window.confirm(`Revoke "${d.name}"? It stops uploading messages and must be re-enrolled with a new code.`)) return;
    try {
      await api(`/admin/devices/${d.id}/revoke`, { method: "POST" });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Devices & SIMs"
        description={
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            Live · updates every 5 seconds
          </span>
        }
        actions={
          <Link to="/enrollment">
            <Button>
              <Icon name="key" className="h-4 w-4" /> Enroll a device
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="sim" label="SIMs available" value={stats ? `${stats.sims_available} / ${stats.sims_total}` : "—"} />
        <Stat icon="signal" label="Devices online" value={stats ? `${stats.devices_online} / ${stats.devices_total}` : "—"} />
        <Stat icon="bolt" label="Pending verifications" value={fmtNumber(stats?.pending_verifications)} />
        <Stat
          icon="check"
          label="Verified · 24h"
          value={fmtNumber(stats?.verified_24h)}
          hint={stats ? `${fmtNumber(stats.verifications_24h)} started · ${fmtNumber(stats.messages_24h)} SMS received` : undefined}
        />
      </div>

      <div className="mt-8 space-y-4">
        {devices === null && <Skeleton className="h-48" />}
        {devices?.length === 0 && (
          <div className="panel">
            <Empty>No gateway devices yet. Create an enrollment code and sign in on the VerifyNumber app.</Empty>
          </div>
        )}
        {devices?.map((d) => (
          <section key={d.id} className={`panel p-6 ${d.revoked_at ? "opacity-50" : ""}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex flex-wrap items-center gap-2.5 font-display text-lg font-semibold text-white">
                  <span className={`h-2.5 w-2.5 rounded-full ${d.online ? "bg-brand-400 shadow-[0_0_12px_rgba(52,211,163,0.9)]" : "bg-ink-600"}`} />
                  {d.name}
                  {d.revoked_at ? <Badge tone="red">Revoked</Badge> : d.online ? <Badge tone="green">Online</Badge> : <Badge>Offline</Badge>}
                </h2>
                <p className="mt-1 text-xs text-ink-500">
                  #{d.id} · {d.model || "unknown model"} · app {d.app_version || "?"} · last heartbeat {timeAgo(d.last_seen_at, now)}
                </p>
              </div>
              {!d.revoked_at && (
                <Button variant="danger" onClick={() => void revoke(d)}>
                  Revoke device
                </Button>
              )}
            </div>

            {d.sims.length === 0 ? (
              <p className="mt-5 text-sm text-ink-500">No SIMs reported yet.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {d.sims.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[15px] font-medium text-white">{s.phone_e164 ?? "Number not set"}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          SIM {s.slot_index + 1} · {s.carrier || "carrier ?"} · sub {s.subscription_id}
                        </p>
                      </div>
                      <Badge tone={stateTone(s.state)} dot>
                        {s.state_label}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                      <span>
                        {s.pending} pending · seen {timeAgo(s.last_seen_at, now)}
                        {!s.enabled && " · off on phone"}
                      </span>
                      {!d.revoked_at && (
                        <label className="flex cursor-pointer items-center gap-2 text-ink-400">
                          {s.admin_enabled ? "Enabled" : "Disabled"}
                          <input
                            type="checkbox"
                            role="switch"
                            className="switch"
                            checked={s.admin_enabled}
                            onChange={() => void toggleSim(s)}
                            aria-label={`Enable SIM ${s.slot_index + 1}`}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
