"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckout } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export function UpsellPanel({
  reason = "free",
}: {
  reason?: "free" | "guest" | "teaser";
}) {
  const { user, login } = useAuth();
  const [busy, setBusy] = useState<"pro" | "deep" | null>(null);
  const [err, setErr] = useState("");

  async function buy(kind: "pro" | "deep") {
    if (!user) {
      login();
      return;
    }
    setBusy(kind);
    setErr("");
    try {
      const order = await createCheckout(
        kind === "deep" ? "once" : "month",
        kind === "deep" ? "deep_scan_once" : "pro_monthly",
      );
      if (!order.checkout_url) throw new Error("No checkout URL");
      window.location.href = order.checkout_url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  const title =
    reason === "guest"
      ? "Sign in for 2 full Free briefs"
      : reason === "teaser"
        ? "Unlock the full brief"
        : "Keep going with Pro or a deep brief";

  const body =
    reason === "guest"
      ? "Guest is 1 full brief + 1 locked preview. Create a free account for 2 full detect-only briefs + 1 locked preview—then upgrade for more."
      : reason === "teaser"
        ? "Preview shows 1 finding. Sign in for 2 full Free briefs + 1 preview, or upgrade to Pro to unlock every finding, risk path, and report."
        : "You’ve used your Free web scans (2 full + 1 preview). Upgrade to Pro or buy a ₹60 deep brief to keep scanning.";

  return (
    <div className="surface animate-rise">
      <div className="border-b border-[var(--line)]/80 bg-[var(--brand-soft)]/35 px-5 py-5 sm:px-6">
        <p className="kicker">
          {reason === "guest"
            ? "Guest limit reached"
            : reason === "teaser"
              ? "Preview locked"
              : "Full Free briefs used"}
        </p>
        <h3 className="mt-2 display text-2xl">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">{body}</p>
        {reason === "guest" || reason === "teaser" ? (
          <button type="button" onClick={() => login()} className="btn-primary mt-4">
            Sign in with Google
          </button>
        ) : null}
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-[var(--line)]/70 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
          <p className="display text-xl">Pro</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
            ₹999<span className="text-sm font-normal text-[var(--muted)]">/mo</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
            <li>Full findings on every scan</li>
            <li>Branded PDF / HTML</li>
            <li>Rescan + finding diffs</li>
          </ul>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void buy("pro")}
            className="btn-primary mt-5 w-full"
          >
            {busy === "pro" ? "Redirecting…" : user ? "Upgrade to Pro" : "Sign in to upgrade"}
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <p className="display text-xl">Deep brief</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
            ₹60<span className="text-sm font-normal text-[var(--muted)]"> once</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
            <li>One Pro-style branded brief</li>
            <li>Same detect-only agents</li>
            <li>No monthly commitment</li>
          </ul>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void buy("deep")}
            className="btn-secondary mt-5 w-full"
          >
            {busy === "deep" ? "Redirecting…" : user ? "Buy ₹60 credit" : "Sign in to buy"}
          </button>
        </div>
      </div>
      {err && <p className="border-t border-[var(--line)] px-5 py-3 text-sm text-[var(--danger)]">{err}</p>}
      <div className="border-t border-[var(--line)]/80 px-5 py-3 text-center sm:px-6">
        <Link href="/pricing" className="text-sm font-medium text-[var(--brand-deep)] hover:underline">
          Compare plans →
        </Link>
      </div>
    </div>
  );
}
