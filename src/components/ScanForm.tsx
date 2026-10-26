"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  claimScan,
  createScan,
  getQuota,
  getReport,
  getScan,
  readClaimToken,
  rememberClaimToken,
  rememberGuestScan,
  type Finding,
  type QuotaInfo,
  type Scan,
} from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { UpsellPanel } from "@/components/UpsellPanel";

type Phase = "idle" | "running" | "done" | "error";

const TRUST = ["Detect-only", "No password sprays", "~2–3 min"];

export function ScanForm({ initialUrl = "" }: { initialUrl?: string }) {
  const { user, login } = useAuth();
  const [url, setUrl] = useState(initialUrl);
  const [attested, setAttested] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Ready when you are.");
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
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
    setReport("");
    setClaimMsg("");
    setUpsell(null);

    const q = await refreshQuota();
    if (q && !q.can_scan && q.mode !== "pro") {
      if (q.mode === "guest") {
        setUpsell("guest");
        setAuthOpen(true);
        setStatus("Guest scans used — sign in for 5 more.");
        return;
      }
      setUpsell("free");
      setStatus("Free scans used — upgrade to continue.");
      return;
    }

    setScan(null);
    setPhase("running");
    setStatus("Starting authorized scan…");

    try {
      const created = await createScan(url.trim(), attested);
      setScan(created);
      if (created.claim_token) rememberClaimToken(created.id, created.claim_token);
      rememberGuestScan({ id: created.id, url: created.url });
      void refreshQuota();
      setStatus(`Engaging ${created.url.replace(/^https?:\/\//, "")}…`);

      let final: Scan | null = null;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const current = await getScan(created.id);
        setScan(current);
        const count = current.findings?.length ?? 0;
        const progress = current.agents_progress || [];
        const active = progress.find((p) => p.status === "running");
        const cleared = progress.filter((p) => p.status === "done" || p.status === "skipped").length;
        if (current.status === "queued") {
          setStatus("In queue — waiting for a worker…");
        } else if (active) {
          setStatus(
            `Probing · ${active.label}${count ? ` · ${count} signal${count === 1 ? "" : "s"}` : ""}`,
          );
        } else {
          setStatus(
            `Scanning · ${cleared}/${progress.length || "…"} checks${count ? ` · ${count} signals` : ""}`,
          );
        }
        if (current.status === "done" || current.status === "failed") {
          final = current;
          break;
        }
      }

      if (!final) throw new Error("Scan timed out. Try again in a minute.");
      if (final.status === "failed") throw new Error(final.error || "Scan failed");

      const md = await getReport(final.id);
      setReport(md);
      setPhase("done");
      setStatus("Scan complete.");
      void refreshQuota();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "GUEST_QUOTA_EXCEEDED") {
          setUpsell("guest");
          setAuthOpen(true);
          setPhase("idle");
          setStatus("Guest scans used — sign in for 5 more.");
          return;
        }
        if (err.code === "FREE_QUOTA_EXCEEDED") {
          setUpsell("free");
          setPhase("idle");
          setStatus("Free scans used — upgrade to continue.");
          return;
        }
      }
      setPhase("error");
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Could not complete the scan.");
    }
  }

  async function onSave() {
    if (!scan) return;
    if (!user) {
      login();
      return;
    }
    const token = scan.claim_token || readClaimToken(scan.id);
    if (!token) {
      setClaimMsg("This scan is already saved or the claim token expired.");
      return;
    }
    setClaimBusy(true);
    setClaimMsg("");
    try {
      const updated = await claimScan(scan.id, token);
      setScan(updated);
      setClaimMsg("Saved to My scans.");
      void refreshQuota();
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setClaimBusy(false);
    }
  }

  const findings: Finding[] = scan?.findings ?? [];
  const canClaim = phase === "done" && scan && !scan.owner_id;
  const remainingLabel = quota
    ? quota.mode === "guest"
      ? `${quota.remaining} of ${quota.limit} guest scans left`
      : quota.mode === "pro"
        ? "Pro · unlimited for your plan"
        : `${quota.remaining} of ${quota.limit} Free scans left`
    : null;

  return (
    <div className="w-full">
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title={upsell === "guest" ? "Sign in for 5 Free scans" : "Sign in to continue"}
        body={
          upsell === "guest"
            ? "Your 2 guest trials are done. Sign in with Google for 5 detect-only scans on Free—then upgrade when you need more."
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
            disabled={phase === "running" || !attested}
            className="min-h-14 rounded-xl bg-[var(--brand)] px-7 text-base font-semibold text-white hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {phase === "running" ? "Scanning…" : "Start scan"}
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
        {phase === "running" && (
          <span className="scan-pulse inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
        )}
        <span>{status}</span>
      </div>

      {upsell && (
        <div className="mt-8">
          <UpsellPanel reason={upsell} />
        </div>
      )}

      {phase === "running" && scan && (
        <ScanProgress
          rows={scan.agents_progress}
          scanStatus={scan.status}
          targetUrl={scan.url}
          findingCount={scan.findings?.length ?? 0}
        />
      )}

      {error && (
        <p className="mt-4 animate-rise rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {canClaim && (
        <div className="mt-5 flex flex-wrap items-center gap-3 animate-rise text-sm text-[var(--ink)]">
          <span className="text-[var(--muted)]">Keep this brief in your account.</span>
          <button
            type="button"
            disabled={claimBusy}
            onClick={() => void onSave()}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
          >
            {user ? (claimBusy ? "Saving…" : "Save to My scans") : "Sign in to save"}
          </button>
          {claimMsg && <span className="text-[var(--muted)]">{claimMsg}</span>}
        </div>
      )}

      {(phase === "done" || (phase === "running" && findings.length > 0)) && scan && (
        <ScanResults scan={scan} report={report} showNextSteps={phase === "done"} />
      )}
    </div>
  );
}
