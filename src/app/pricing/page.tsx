"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuth } from "@/components/AuthProvider";
import { createCheckout, getPlans, syncBilling } from "@/lib/api";
import { RetryBanner } from "@/components/RetryBanner";
import { trackEvent } from "@/lib/analytics";

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
    trackEvent("checkout_click", { interval, plan_id: planId || interval, signed_in: Boolean(user) });
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
      trackEvent("checkout_redirect", { interval, plan_id: planId || interval });
      window.location.href = order.checkout_url;
    } catch (err) {
      trackEvent("checkout_failed", { interval });
      setMsg(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const monthly = plans?.plans.find((p) => p.id === "pro_monthly");
  const yearly = plans?.plans.find((p) => p.id === "pro_yearly");
  const deep = plans?.plans.find((p) => p.id === "deep_scan_once");
  const ready = Boolean(plans?.payments_ready ?? plans?.razorpay_ready);
  const deepCredits = user?.deep_credits ?? 0;

  return (
    <>
      <div className="max-w-2xl">
        <p className="kicker">Plans</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="display text-4xl sm:text-5xl">Pricing</h1>
          {user && <PlanBadge plan={user.plan} />}
        </div>
        <p className="mt-3 text-[var(--muted)] leading-relaxed">
          {isPro
            ? "You’re on Pro — branded briefs, higher limits, MCP Agent, and rescan diffs are unlocked."
            : "Guest: 1 full brief + 1 locked preview. Sign in for 2 full Free briefs + 1 locked preview, then upgrade to Pro or buy a ₹60 deep brief."}
        </p>
        <Link
          href="/#mcp"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)]/80 px-4 py-2.5 text-sm font-semibold text-[var(--brand-deep)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
        >
          <span className="scan-pulse inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          MCP Agent — scan from your agent
          <span aria-hidden className="text-[var(--muted)]">
            →
          </span>
        </Link>
      </div>

      {confirming && (
        <p className="mt-6 flex items-center gap-2 font-mono text-sm text-[var(--muted)]">
          <span className="scan-pulse inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          Confirming payment…
        </p>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className={`surface p-6 ${isPro ? "opacity-55" : ""}`}>
          <p className="kicker">Start</p>
          <h2 className="mt-2 display text-2xl">Free</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">₹0</p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
            <li>Guest: 1 full + 1 preview</li>
            <li>After signup: 2 full Free briefs</li>
            <li>Then 1 locked preview — next scan needs upgrade</li>
            <li>Share links · watermarked PDF</li>
            <li className="rounded-lg border border-[var(--brand)]/20 bg-[var(--brand-soft)]/50 px-3 py-2.5 text-[var(--ink)]">
              <span className="chip chip-brand mr-1.5">MCP Agent</span>
              1 Free agent scan
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Google login required · API key in{" "}
                <Link href="/settings" className="font-medium text-[var(--brand-deep)] underline-offset-2 hover:underline">
                  MCP Agents
                </Link>
              </span>
            </li>
          </ul>
        </div>

        <div className="surface p-6">
          <p className="kicker">One brief</p>
          <h2 className="mt-2 display text-2xl">Deep brief</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
            ₹{deep?.price ?? 60}
            <span className="text-base font-normal text-[var(--muted)]"> once</span>
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
            <li>Same agents as Free / Pro</li>
            <li>One Pro-style branded HTML brief</li>
            <li>
              Credits on hand:{" "}
              <span className="font-medium text-[var(--ink)]">{deepCredits}</span>
            </li>
          </ul>
          <button
            type="button"
            disabled={busy || confirming || isPro || (Boolean(user) && !ready)}
            onClick={() => {
              if (!user) {
                login();
                return;
              }
              void upgrade("once", "deep_scan_once");
            }}
            className="btn-secondary mt-8 w-full"
          >
            {isPro ? "Included in Pro" : user ? "Buy ₹60 credit" : "Sign in to buy"}
          </button>
        </div>

        <div className="surface relative p-6 ring-1 ring-[var(--brand)]/25">
          <div className="absolute right-4 top-4">
            <span className="chip chip-brand">Best value</span>
          </div>
          <p className="kicker">Always full</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="display text-2xl">Pro</h2>
            {isPro && <PlanBadge plan="pro" size="sm" />}
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
            ₹{monthly?.price ?? 999}
            <span className="text-base font-normal text-[var(--muted)]">/mo</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">or ₹{yearly?.price ?? 7999}/yr</p>
          <ul className="mt-6 space-y-2.5 text-sm text-[var(--muted)]">
            <li>Up to {monthly?.history ?? 30} saved scans</li>
            <li>Full branded PDF / HTML</li>
            <li>Rescan + finding diff</li>
            <li>Higher rate limits</li>
            <li className="rounded-lg border border-[var(--brand)]/25 bg-[var(--brand-soft)]/60 px-3 py-2.5 text-[var(--ink)]">
              <span className="chip chip-brand mr-1.5">MCP Agent</span>
              Web + agent share Pro quota
              <span className="mt-1 block text-xs text-[var(--muted)]">
                API keys in{" "}
                <Link href="/settings" className="font-medium text-[var(--brand-deep)] underline-offset-2 hover:underline">
                  MCP Agents
                </Link>
              </span>
            </li>
          </ul>

          {isPro ? (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/70 px-4 py-3">
              <svg
                className="h-5 w-5 shrink-0 text-[var(--brand)]"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden
              >
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
            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || confirming || (Boolean(user) && !ready)}
                onClick={() => {
                  if (!user) {
                    login();
                    return;
                  }
                  void upgrade("month");
                }}
                className="btn-primary w-full"
              >
                {user ? "Upgrade monthly" : "Sign in to upgrade"}
              </button>
              <button
                type="button"
                disabled={busy || confirming || !user || !ready}
                onClick={() => void upgrade("year")}
                className="btn-secondary w-full"
              >
                Yearly · save more
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
          <p className="mt-8 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/50 px-4 py-3 text-sm text-[var(--brand-deep)]">
            {msg}
          </p>
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
      <div className="animate-rise">
        <Suspense fallback={<p className="font-mono text-sm text-[var(--muted)]">Loading…</p>}>
          <PricingBody />
        </Suspense>
      </div>
    </PageShell>
  );
}
