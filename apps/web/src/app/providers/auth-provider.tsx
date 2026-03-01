import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type AuthUser = {
  id: string;
  email: string;
  institutionId: string;
  role: "student" | "admin";
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("aiguidebook.access_token");
    if (saved) {
      setAccessToken(saved);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      localStorage.removeItem("aiguidebook.access_token");
      return;
    }
    localStorage.setItem("aiguidebook.access_token", accessToken);
    api.getMe(accessToken).then((resp) => setUser(resp.data)).catch(() => setUser(null));
  }, [accessToken]);

  const value = useMemo(() => ({ user, accessToken, setAccessToken, setUser }), [user, accessToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
