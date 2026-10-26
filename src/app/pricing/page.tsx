"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { createCheckout, getPlans } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PlansPayload = {
  currency: string;
  razorpay_ready: boolean;
  plans: {
    id: string;
    name: string;
    price: number;
    interval?: string;
    history: number;
    pdf: boolean;
  }[];
};

export default function PricingPage() {
  const { user, login, refresh } = useAuth();
  const [plans, setPlans] = useState<PlansPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void getPlans()
      .then(setPlans)
      .catch((err) => setMsg(err instanceof Error ? err.message : String(err)));
  }, []);

  async function upgrade(interval: "month" | "year") {
    if (!user) {
      login();
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const order = await createCheckout(interval);
      if (!window.Razorpay) {
        setMsg("Payment widget still loading — try again in a second.");
        return;
      }
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.order_id,
        prefill: order.prefill,
        notes: order.notes,
        handler: async () => {
          setMsg("Payment received. Activating Pro…");
          await new Promise((r) => setTimeout(r, 1500));
          await refresh();
          setMsg("If Pro is not active yet, refresh in a minute.");
        },
      });
      rzp.open();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const free = plans?.plans.find((p) => p.id === "free");
  const monthly = plans?.plans.find((p) => p.id === "pro_monthly");
  const yearly = plans?.plans.find((p) => p.id === "pro_yearly");

  return (
    <PageShell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="animate-rise pt-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Pricing
        </h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Sign in for history and share. Pro unlocks branded briefs and higher saved-scan limits.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">Free</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">₹0</p>
            <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
              <li>Authorized one-shot scans</li>
              <li>Last {free?.history ?? 10} saved scans</li>
              <li>Share links</li>
              <li>Watermarked HTML / PDF</li>
            </ul>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">Pro</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">
              ₹{monthly?.price ?? 999}
              <span className="text-base font-normal text-[var(--muted)]">/mo</span>
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">or ₹{yearly?.price ?? 7999}/yr</p>
            <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
              <li>Up to {monthly?.history ?? 500} saved scans</li>
              <li>Full branded PDF / HTML</li>
              <li>Rescan + finding diff</li>
              <li>Higher rate limits</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || plans?.razorpay_ready === false}
                onClick={() => void upgrade("month")}
                className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
              >
                {user ? "Upgrade monthly" : "Sign in to upgrade"}
              </button>
              <button
                type="button"
                disabled={busy || plans?.razorpay_ready === false}
                onClick={() => void upgrade("year")}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] disabled:opacity-50"
              >
                Yearly
              </button>
            </div>
            {plans && !plans.razorpay_ready && (
              <p className="mt-4 text-sm text-[var(--warn)]">
                Checkout is not configured on this environment yet.
              </p>
            )}
          </div>
        </div>

        {msg && <p className="mt-8 text-sm text-[var(--muted)]">{msg}</p>}
        {user?.plan === "pro" && (
          <p className="mt-4 text-sm text-[var(--brand-deep)]">You are on Pro.</p>
        )}
      </div>
    </PageShell>
  );
}
