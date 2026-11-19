import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { errorMessage, loadGoogleIdentity, useAuth } from "../lib/auth";
import { Button, ErrorText, Icon, Input, Label, Logo } from "../components/ui";

type AuthConfig = { password_enabled: boolean; google_enabled: boolean; google_client_id: string };

export default function Login() {
  const { me, loading, signInWithPassword, signInWithGoogle } = useAuth();
  const [cfg, setCfg] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<AuthConfig>("/admin/auth/config")
      .then(setCfg)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // Google button: rendered only once GOOGLE_CLIENT_ID is configured on the server.
  useEffect(() => {
    if (!cfg?.google_enabled || me) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !googleRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: cfg.google_client_id,
          ux_mode: "popup",
          itp_support: true,
          callback: async ({ credential }) => {
            setError("");
            setBusy(true);
            try {
              await signInWithGoogle(credential);
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 320,
        });
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [cfg, me, signInWithGoogle]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (!loading && me) return <Navigate to="/" replace />;

  const unavailable = cfg && !cfg.password_enabled && !cfg.google_enabled;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,138,0.22),transparent)] blur-2xl"
        aria-hidden
      />
      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="panel p-8">
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-brand-400/30 bg-brand-400/10 text-brand-300">
              <Icon name="shield" className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">Admin sign in</h1>
            <p className="mt-2 text-sm leading-6 text-ink-400">Restricted to VerifyNumber administrators.</p>
          </div>

          {unavailable ? (
            <div className="mt-8">
              <ErrorText>Admin sign-in is not configured on the server (ADMIN_EMAILS is empty).</ErrorText>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <ErrorText>{error}</ErrorText>
                <Button type="submit" disabled={busy} className="w-full py-2.5">
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              {cfg?.google_enabled && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-500">
                    <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <div ref={googleRef} className={`flex justify-center ${busy ? "pointer-events-none opacity-50" : ""}`} />
                </>
              )}
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">Sessions expire after 12 hours. Every sign-in is logged.</p>
      </div>
    </div>
  );
}
