import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "./api";
import type { Me } from "./api";

type AuthState = {
  me: Me | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Me>("/admin/auth/me")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
    const onUnauthorized = () => setMe(null);
    window.addEventListener("vn:unauthorized", onUnauthorized);
    return () => window.removeEventListener("vn:unauthorized", onUnauthorized);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const user = await api<Me>("/admin/auth/login", { method: "POST", body: { email, password } });
    setMe(user);
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    const user = await api<Me>("/admin/auth/google", { method: "POST", body: { credential } });
    setMe(user);
  }, []);

  const signOut = useCallback(async () => {
    await api("/admin/auth/logout", { method: "POST" }).catch(() => {});
    window.google?.accounts.id.disableAutoSelect();
    setMe(null);
  }, []);

  return <AuthContext value={{ me, loading, signInWithPassword, signInWithGoogle, signOut }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
}

// ---- Google Identity Services (loaded on demand) ----

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (r: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error("Could not load Google Sign-In. Check your connection or ad blocker."));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}
