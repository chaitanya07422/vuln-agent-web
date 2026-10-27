"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createScan,
  getQuota,
  rememberClaimToken,
  rememberGuestScan,
  type QuotaInfo,
} from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { RetryBanner } from "@/components/RetryBanner";
import { UpsellPanel } from "@/components/UpsellPanel";

type Phase = "idle" | "starting" | "error";

const TRUST = ["Detect-only", "No password sprays", "~4–6 min"];

export function ScanForm({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [url, setUrl] = useState(initialUrl);
  const [attested, setAttested] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Ready when you are.");
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [upsell, setUpsell] = useState<"guest" | "free" | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const refreshQuota = useCallback(async () => {
    try {
      const q = await getQuota();
      setQuota(q);
      return q;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota, user?.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setUpsell(null);

    const q = await refreshQuota();
    if (q && !q.can_scan && q.mode !== "pro") {
      if (q.mode === "guest") {
        setUpsell("guest");
        setAuthOpen(true);
        setStatus("Guest scans used — sign in for 2 full Free briefs.");
        return;
      }
      setUpsell("free");
      setStatus("Free scan limit reached — upgrade for full briefs.");
      return;
    }

    setPhase("starting");
    setStatus("Starting authorized scan…");

    try {
      const created = await createScan(url.trim(), attested);
      if (created.claim_token) rememberClaimToken(created.id, created.claim_token);
      rememberGuestScan({ id: created.id, url: created.url });
      void refreshQuota();
      setStatus("Opening live engagement…");
      // Live /scan page owns progress + results (avoids homepage fake timeouts).
      router.push(`/scan/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "GUEST_QUOTA_EXCEEDED") {
          setUpsell("guest");
          setAuthOpen(true);
          setPhase("idle");
          setStatus("Guest scans used — sign in for 2 full Free briefs.");
          return;
        }
        if (err.code === "FREE_QUOTA_EXCEEDED") {
          setUpsell("free");
          setPhase("idle");
          setStatus("Free scan limit reached — upgrade for full briefs.");
          return;
        }
      }
      setPhase("error");
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Could not start the scan.");
    }
  }

  const remainingLabel = quota
    ? quota.mode === "guest"
      ? `${quota.remaining} of ${quota.limit} guest · next ${quota.next_detail || "full"}`
      : quota.mode === "pro"
        ? "Pro · full briefs"
        : `${quota.full_remaining ?? 0} full Free left · next ${quota.next_detail || "teaser"}`
    : null;

  return (
    <div className="w-full">
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title={upsell === "guest" ? "Sign in for 2 full Free briefs" : "Sign in to continue"}
        body={
          upsell === "guest"
            ? "Guest gives 1 full brief + 1 locked preview. Sign in with Google for 2 more full Free briefs—then previews until you upgrade."
            : "Save history, claim this brief, and keep scanning under your Free allowance."
        }
      />

      <form onSubmit={onSubmit} className="animate-rise-delay-2 flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="text-sm font-medium text-[var(--muted)]" htmlFor="target-url">
            Website URL
          </label>
          {remainingLabel && (
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--brand)]">
              {remainingLabel}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="target-url"
            type="url"
            required
            placeholder="https://your-company.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-h-14 flex-1 rounded-xl border border-[var(--line)] bg-white px-4 text-base text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[#9aaca3] focus:border-[var(--brand)] focus:ring-2"
          />
          <button
            type="submit"
            disabled={phase === "starting" || !attested}
            className="min-h-14 rounded-xl bg-[var(--brand)] px-7 text-base font-semibold text-white hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {phase === "starting" ? "Starting…" : "Start scan"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRUST.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1 font-mono text-[11px] text-[var(--brand-deep)]"
            >
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              {t}
            </span>
          ))}
        </div>

        <label className="flex max-w-2xl cursor-pointer items-start gap-3 text-sm leading-snug text-[var(--muted)]">
          <input
            type="checkbox"
            checked={attested}
            onChange={(e) => setAttested(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            required
          />
          <span>
            I own this website or have written authorization to test it. Scans are detect-only —
            no password sprays or exploitation.
          </span>
        </label>
      </form>

      <div className="mt-5 flex items-center gap-3 px-1 font-mono text-sm text-[var(--muted)]">
        {phase === "starting" && (
          <span className="scan-pulse inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
        )}
        <span>{status}</span>
      </div>

      {upsell && (
        <div className="mt-8">
          <UpsellPanel reason={upsell} />
        </div>
      )}

      {error && (
        <RetryBanner
          message={error}
          busy={phase === "starting"}
          retryLabel="Retry start"
          onRetry={() => {
            const form = document.getElementById("target-url")?.closest("form");
            form?.requestSubmit();
          }}
        />
      )}
    </div>
  );
}
