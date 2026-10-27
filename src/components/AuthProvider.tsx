"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, googleLoginUrl, logout as apiLogout, type User } from "@/lib/auth";
import { claimGuestScans } from "@/lib/api";
import { setAccessToken } from "@/lib/session";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    if (me) {
      await claimGuestScans();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
          if (me) await claimGuestScans();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      refresh,
      login: () => {
        window.location.href = googleLoginUrl();
      },
      logout: async () => {
        await apiLogout();
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
