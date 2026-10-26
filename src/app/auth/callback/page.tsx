"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/session";
import { fetchMe } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const err = q.get("error");
    if (err) {
      setMessage(`Sign-in failed: ${err}`);
      return;
    }
    const token = params.get("access_token");
    if (token) {
      setAccessToken(token);
      window.history.replaceState(null, "", "/auth/callback");
    }
    (async () => {
      try {
        await refresh();
        const me = await fetchMe();
        if (!me) {
          setMessage("Could not load your account. Try again.");
          return;
        }
        setMessage("Signed in. Redirecting…");
        router.replace("/scans");
      } catch {
        setMessage("Sign-in failed. Try again.");
      }
    })();
  }, [refresh, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5">
      <p className="animate-fade font-mono text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}
