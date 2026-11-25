// Client for the VerifyNumber Go API. Auth is the HttpOnly session cookie set
// by api.verifynumber.in; admin.verifynumber.in is the same site, so the
// browser sends it with credentials: "include".

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://verifynumber.in").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1${path}`, {
      method: init.method ?? "GET",
      credentials: "include",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network", "Cannot reach the VerifyNumber API. Check your connection.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } }).error ?? {};
    if (res.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new Event("vn:unauthorized"));
    }
    throw new ApiError(res.status, err.code ?? "error", err.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- types (mirror the Go JSON) ----

export type Me = {
  id: number;
  name: string;
  company: string;
  email: string;
  role: "vendor" | "admin";
};

export type SimState = {
  id: number;
  device_id: number;
  slot_index: number;
  subscription_id: number;
  phone_e164: string | null;
  carrier: string;
  status: string;
  enabled: boolean;
  admin_enabled: boolean;
  state: "available" | "offline" | "disabled" | "needs_number";
  state_label: string;
  last_seen_at: string | null;
  pending: number;
};

export type Device = {
  id: number;
  name: string;
  model: string;
  app_version: string;
  online: boolean;
  last_seen_at: string | null;
  revoked_at: string | null;
  created_at: string;
  sims: SimState[];
};

export type Overview = {
  pending_verifications: number;
  verifications_24h: number;
  verified_24h: number;
  messages_24h: number;
  devices_total: number;
  devices_online: number;
  sims_total: number;
  sims_available: number;
};

export type EnrollmentCode = {
  id: number;
  label: string;
  expires_at: string;
  used_at: string | null;
  device_id: number | null;
  device_name: string | null;
  created_at: string;
};

export type InboundMessage = {
  id: number;
  device_id: number;
  sim_id: number | null;
  sim_phone: string | null;
  subscription_id: number;
  sender: string;
  sender_e164: string | null;
  body: string;
  received_at: string;
  verification_id: number | null;
  /** request_id (UUIDv7) of the verification this message matched, if any. */
  request_id: string | null;
  created_at: string;
};

export type EmailConfig = {
  configured: boolean;
  senders: string[];
  from_name: string;
};

export type OutboundEmail = {
  id: number;
  sent_by: number | null;
  sent_by_email: string | null;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  reply_to: string;
  subject: string;
  body: string;
  is_html: boolean;
  status: "sent" | "failed";
  provider_message_id: string;
  error: string;
  created_at: string;
};

// ---- formatting ----

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtNumber(n: number | undefined | null): string {
  return n == null ? "—" : n.toLocaleString("en-IN");
}
