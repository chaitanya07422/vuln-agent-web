"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuth } from "@/components/AuthProvider";
import { createCheckout, getPlans, syncBilling } from "@/lib/api";
import { RetryBanner } from "@/components/RetryBanner";

type PlansPayload = {
  currency: string;
  payments_ready?: boolean;
  razorpay_ready?: boolean;
  plans: {
    id: string;
    name: string;
    price: number;
    interval?: string;
    history: number;
    pdf: boolean;
  }[];
};

function PricingBody() {
  const { user, login, refresh } = useAuth();
  const params = useSearchParams();
  const [plans, setPlans] = useState<PlansPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);

  const isPro = user?.plan === "pro";

  const [plansTick, setPlansTick] = useState(0);

  useEffect(() => {
    void getPlans()
      .then((p) => {
        setPlans(p);
        setMsg("");
      })
      .catch((err) => setMsg(err instanceof Error ? err.message : String(err)));
  }, [plansTick]);

  useEffect(() => {
    if (params.get("paid") !== "1" || !user) return;
    let cancelled = false;
    (async () => {
      setConfirming(true);
      setMsg("");
      try {
        // Polar webhooks can lag a few seconds — retry sync.
        let plan = user.plan;
        for (let i = 0; i < 6; i++) {
          const synced = await syncBilling();
          plan = synced.plan || plan;
          if (plan === "pro" || (synced.deep_credits ?? 0) > (user.deep_credits ?? 0)) break;
          await new Promise((r) => setTimeout(r, 1500));
        }
        await refresh();
        if (!cancelled) {
          setConfirming(false);
          setMsg(plan === "pro" ? "Pro unlocked — full briefs are on." : "Payment synced.");
          window.history.replaceState(null, "", "/pricing");
        }
      } catch (err) {
        if (!cancelled) {
          setConfirming(false);
          setMsg(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, user, refresh]);

  async function upgrade(interval: "month" | "year" | "once", planId?: string) {
    if (!user) {
      login();
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const order = await createCheckout(interval, planId);
      if (!order.checkout_url) {
        setMsg("No checkout URL returned.");
        setBusy(false);
        return;
      }
      window.location.href = order.checkout_url;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const free = plans?.plans.find((p) => p.id === "free");
  const monthly = plans?.plans.find((p) => p.id === "pro_monthly");
  const yearly = plans?.plans.find((p) => p.id === "pro_yearly");
  const deep = plans?.plans.find((p) => p.id === "deep_scan_once");
  const ready = Boolean(plans?.payments_ready ?? plans?.razorpay_ready);
  const deepCredits = user?.deep_credits ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Pricing
        </h1>
        {user && <PlanBadge plan={user.plan} />}
      </div>
      <p className="mt-3 max-w-xl text-[var(--muted)]">
        {isPro
          ? "You’re on Pro — branded briefs, higher limits, and rescan diffs are unlocked."
          : "Guest: 1 full brief + 1 locked preview. Sign in for 2 full Free briefs, then previews until Pro or a ₹60 deep brief."}
      </p>

      {confirming && (
        <p className="mt-6 font-mono text-sm text-[var(--muted)]">Confirming payment…</p>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        <div className={isPro ? "opacity-60" : undefined}>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">Free</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">₹0</p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
            <li>Guest: 1 full + 1 preview (1 finding)</li>
            <li>After signup: 2 full Free briefs</li>
            <li>Then preview-only (1 finding locked rest)</li>
            <li>Share links · watermarked PDF</li>
          </ul>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Deep brief
          </h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">
            ₹{deep?.price ?? 60}
            <span className="text-base font-normal text-[var(--muted)]"> once</span>
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
            <li>Same agents as Free / Pro</li>
            <li>One Pro-style branded HTML brief</li>
            <li>Credits: {deepCredits}</li>
          </ul>
          <div className="mt-8">
            <button
              type="button"
              disabled={busy || !ready || confirming || isPro}
              onClick={() => void upgrade("once", "deep_scan_once")}
              className="rounded-xl border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] disabled:opacity-50"
            >
              {isPro ? "Included in Pro" : user ? "Buy ₹60 credit" : "Sign in to buy"}
            </button>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">Pro</h2>
            {isPro && <PlanBadge plan="pro" size="sm" />}
          </div>
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

          {isPro ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-[var(--brand)]" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1.5 9.9 5.4l4.3.4-3.3 2.9.9 4.2L8 11.1l-3.8 1.8.9-4.2L1.8 5.8l4.3-.4L8 1.5Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[var(--brand-deep)]">Your current plan</p>
                <p className="text-xs text-[var(--muted)]">
                  Payment confirmed
                  {user?.plan_expires_at
                    ? ` · renews ${new Date(user.plan_expires_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !ready || confirming}
                onClick={() => void upgrade("month")}
                className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
              >
                {user ? "Upgrade monthly" : "Sign in to upgrade"}
              </button>
              <button
                type="button"
                disabled={busy || !ready || confirming}
                onClick={() => void upgrade("year")}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] disabled:opacity-50"
              >
                Yearly
              </button>
            </div>
          )}
          {plans && !ready && !isPro && (
            <p className="mt-4 text-sm text-[var(--warn)]">
              Checkout is not configured on this environment yet.
            </p>
          )}
        </div>
      </div>

      {msg &&
        (msg.toLowerCase().includes("unlock") ||
        msg.toLowerCase().includes("synced") ||
        msg.toLowerCase().includes("confirming") ? (
          <p className="mt-8 text-sm text-[var(--brand-deep)]">{msg}</p>
        ) : (
          <RetryBanner
            message={msg}
            busy={busy || confirming}
            retryLabel={params.get("paid") === "1" ? "Retry sync" : "Retry load"}
            onRetry={() => {
              if (params.get("paid") === "1") {
                window.location.href = "/pricing?paid=1";
                return;
              }
              setMsg("");
              setPlansTick((n) => n + 1);
            }}
          />
        ))}
    </>
  );
}

export default function PricingPage() {
  return (
    <PageShell>
      <div className="animate-rise pt-4">
        <Suspense fallback={<p className="font-mono text-sm text-[var(--muted)]">Loading…</p>}>
          <PricingBody />
        </Suspense>
      </div>
    </PageShell>
  );
}
