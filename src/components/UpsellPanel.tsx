"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckout } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export function UpsellPanel({
  reason = "free",
}: {
  reason?: "free" | "guest";
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

  return (
    <div className="animate-rise overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--line)]/80 bg-[var(--brand-soft)]/40 px-5 py-4 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
          {reason === "guest" ? "Guest limit reached" : "Free scans used"}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
          {reason === "guest"
            ? "Sign in for 5 more scans on Free"
            : "Keep going with Pro or a deep brief"}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          {reason === "guest"
            ? "Your two guest trials are done. Create a free account for five full detect-only scans—then upgrade when you need more."
            : "You’ve used your five Free scans. Upgrade to Pro for ongoing briefs, or buy a ₹60 deep brief credit for one branded report."}
        </p>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-[var(--line)]/70 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">Pro</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
            ₹999<span className="text-sm font-normal text-[var(--muted)]">/mo</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
            <li>Hundreds of saved scans</li>
            <li>Branded PDF / HTML</li>
            <li>Rescan + finding diffs</li>
          </ul>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void buy("pro")}
            className="mt-5 min-h-11 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
          >
            {busy === "pro" ? "Redirecting…" : user ? "Upgrade to Pro" : "Sign in to upgrade"}
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">Deep brief</p>
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
            className="mt-5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--brand-deep)] hover:border-[var(--brand)] disabled:opacity-50"
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
