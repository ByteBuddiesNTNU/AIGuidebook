import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUserDto } from "@aiguidebook/shared";
import { api } from "../../lib/api";

type AuthContextValue = {
  user: AuthUserDto | null;
  accessToken: string | null;
  isAuthReady: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUserDto | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("aiguidebook.access_token");
  });

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("aiguidebook.access_token", accessToken);
    } else {
      localStorage.removeItem("aiguidebook.access_token");
    }
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      try {
        if (accessToken) {
          try {
            const resp = await api.getMe(accessToken);
            
            if (!cancelled) {
              setUser(resp.data);
            }
            return;
          } catch {
            // Fall through to refresh.
          }
        }

        const refreshed = await api.refresh();
        if (!cancelled) {
          setAccessToken(refreshed.data.accessToken);
          setUser(refreshed.data.user);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    }

    bootstrapAuth();

    return () => {
      cancelled = true;
    };
    // Run only once at startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const expiresAt = getTokenExpiryMs(accessToken);
    if (!expiresAt) {
      setAccessToken(null);
      setUser(null);
      return;
    }

    const refreshLeadMs = 10_000;
    const delay = Math.max(expiresAt - Date.now() - refreshLeadMs, 0);

    const timer = setTimeout(async () => {
      try {
        const refreshed = await api.refresh();
        setAccessToken(refreshed.data.accessToken);
        setUser(refreshed.data.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [accessToken]);

  const value = useMemo(() => ({ user, accessToken, isAuthReady, setAccessToken, setUser }), [user, accessToken, isAuthReady]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

function getTokenExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}
