"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, googleLoginUrl, logout as apiLogout, type User } from "@/lib/auth";
import { claimGuestScans } from "@/lib/api";
import { setAccessToken } from "@/lib/session";
import { identifyUser, resetAnalytics, trackEvent } from "@/lib/analytics";

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
      identifyUser(me);
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
          if (me) {
            identifyUser(me);
            await claimGuestScans();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) identifyUser(user);
  }, [user]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      refresh,
      login: () => {
        trackEvent("login_click", { source: "auth_provider" });
        window.location.href = googleLoginUrl();
      },
      logout: async () => {
        trackEvent("logout");
        await apiLogout();
        setAccessToken(null);
        setUser(null);
        resetAnalytics();
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
