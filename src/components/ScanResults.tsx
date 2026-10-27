"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Finding, Scan } from "@/lib/api";
import { getDiff, rescan, unlockScan } from "@/lib/api";
import { buildDisplaySummary } from "@/lib/checks";
import { useAuth } from "@/components/AuthProvider";
import { RetryBanner } from "@/components/RetryBanner";
import { UpgradeInterestModal } from "@/components/UpgradeInterestModal";

const ORDER = ["critical", "high", "medium", "low", "info"] as const;

const PRO_UNLOCKS = [
  "Every finding with evidence",
  "How this could be abused",
  "Fix steps per finding",
  "HTML / PDF company brief",
] as const;

const BLUR_TITLES = [
  "Sensitive path exposed without auth",
  "Misconfigured cookie or session flag",
  "Public stack fingerprint leak",
  "TLS or header hygiene gap",
];

function sevClass(sev: string) {
  switch (sev) {
    case "critical":
    case "high":
      return "bg-red-50 text-[var(--danger)]";
    case "medium":
      return "bg-amber-50 text-[var(--warn)]";
    default:
      return "bg-[var(--brand-soft)] text-[var(--brand-deep)]";
  }
}

function Action({
  children,
  onClick,
  href,
  download,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  download?: boolean;
  disabled?: boolean;
}) {
  const className =
    "rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white hover:text-[var(--brand-deep)] disabled:opacity-50";
  if (href) {
    const internal = href.startsWith("/") && !href.startsWith("//");
    if (internal && !download) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target={download ? undefined : "_blank"}
        rel="noreferrer"
        download={download || undefined}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function ScanResults({
  scan,
  report,
  showNextSteps = false,
  onScanUpdate,
}: {
  scan: Scan;
  report: string;
  showNextSteps?: boolean;
  onScanUpdate?: (scan: Scan) => void;
}) {
  const { user, login, refresh } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [diffText, setDiffText] = useState("");
  const [actionError, setActionError] = useState("");
  const [interest, setInterest] = useState<"pro" | "deep" | null>(null);

  const teaser = scan.detail_level === "teaser";
  const findings = [...(scan.findings || [])]
    .filter((f) => f.severity !== "info" && f.agent !== "reporter")
    .sort(
      (a, b) =>
        ORDER.indexOf(a.severity as (typeof ORDER)[number]) -
        ORDER.indexOf(b.severity as (typeof ORDER)[number]),
    );
  const actionable = findings.filter((f) => ["critical", "high", "medium"].includes(f.severity));
  const topFixes = actionable.slice(0, 2);
  const summary = buildDisplaySummary(scan);
  const allClear = Boolean(summary.all_clear);
  const hidden = scan.hidden_findings ?? 0;
  const totalSignals = scan.findings_total ?? findings.length + hidden;
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/scan/${scan.id}` : `/scan/${scan.id}`;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Could not copy link");
    }
  }

  async function onRescan() {
    if (!user) {
      login();
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const next = await rescan(scan.id);
      const diff = await getDiff(scan.id, next.id);
      const c = diff.diff?.counts || {};
      setDiffText(
        `Rescan queued ${next.id.slice(0, 8)}… (+${c.new || 0} new · −${c.fixed || 0} fixed · ${c.still_open || 0} open)`,
      );
      router.push(`/scan/${next.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock() {
    if (!user) {
      login();
      return;
    }
    const credits = user.deep_credits ?? 0;
    if (credits <= 0) {
      setInterest("deep");
      return;
    }
    setUnlockBusy(true);
    setActionError("");
    try {
      const updated = await unlockScan(scan.id);
      onScanUpdate?.(updated);
      await refresh();
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setUnlockBusy(false);
    }
  }

  function onUpgradePro() {
    if (!user) {
      login();
      return;
    }
    setInterest("pro");
  }

  if (teaser) {
    const featured = findings[0] || null;
    const blurCount = Math.min(Math.max(hidden, 0), 3);
    const unlockLabel = !user
      ? "Sign in to unlock"
      : unlockBusy
        ? "Working…"
        : (user.deep_credits ?? 0) > 0
          ? "Unlock with credit"
          : "Unlock for ₹60";

    return (
      <section className="mt-12 animate-rise">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Preview brief</p>
            <h2 className="mt-1 display text-3xl">One finding unlocked</h2>
            <p className="mt-1 text-[var(--muted)]">
              {totalSignals} signal{totalSignals === 1 ? "" : "s"} on this pass
              {hidden > 0 ? ` · ${hidden} still locked` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)]/80 bg-white/50 p-1">
            <Action href="/#scan">New scan</Action>
            <Action href={`/?url=${encodeURIComponent(scan.url)}#scan`}>Scan again</Action>
            <Action onClick={() => void onCopy()}>{copied ? "Copied" : "Copy link"}</Action>
          </div>
        </div>

        {actionError && (
          <RetryBanner
            message={actionError}
            busy={unlockBusy}
            retryLabel="Retry unlock"
            onRetry={() => {
              setActionError("");
              void onUnlock();
            }}
          />
        )}

        {featured ? (
          <article className="border-t border-[var(--line)] pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${sevClass(featured.severity)}`}
              >
                {featured.severity}
              </span>
              <span className="font-mono text-xs text-[var(--muted)]">{featured.agent}</span>
            </div>
            <h3 className="mt-3 display text-2xl">{featured.title}</h3>
            {featured.explanation && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink)]">
                {featured.explanation}
              </p>
            )}
            <p className="mt-4 text-sm text-[var(--muted)]">
              Evidence URL, snippet, and the recommended fix unlock with the full brief.
            </p>
          </article>
        ) : (
          <p className="border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
            {summary.headline || "Preview ready — unlock to open the full company brief."}
          </p>
        )}

        {hidden > 0 && (
          <div className="relative mt-8" aria-hidden>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
              {hidden} more locked
            </p>
            <ul className="space-y-3">
              {Array.from({ length: blurCount }, (_, i) => (
                <li
                  key={i}
                  className="select-none overflow-hidden rounded-xl border border-[var(--line)]/70 bg-white/55 px-4 py-3 blur-[5px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-14 rounded bg-[var(--line)]" />
                    <span className="h-3 w-20 rounded bg-[var(--line)]/80" />
                  </div>
                  <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {BLUR_TITLES[i % BLUR_TITLES.length]}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Locked finding detail stays behind Pro or a deep brief.
                  </p>
                </li>
              ))}
            </ul>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg)] to-transparent"
              aria-hidden
            />
          </div>
        )}

        <div className="surface mt-10">
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="kicker">Full brief unlocks</p>
            <h3 className="mt-1 display text-2xl">See the rest of this scan</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PRO_UNLOCKS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--ink)]">
                  <span className="mt-0.5 text-[var(--brand)]" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={unlockBusy}
                onClick={() => void onUnlock()}
                className="btn-primary"
              >
                {unlockLabel}
              </button>
              <button
                type="button"
                disabled={unlockBusy}
                onClick={() => onUpgradePro()}
                className="btn-secondary"
              >
                {user ? "Upgrade to Pro" : "Sign in for Pro"}
              </button>
            </div>
            {(user?.deep_credits ?? 0) > 0 && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                {user!.deep_credits} deep credit{user!.deep_credits === 1 ? "" : "s"} ready on this
                account.
              </p>
            )}
            <p className="mt-4 text-sm text-[var(--muted)]">
              <Link href="/pricing" className="font-medium text-[var(--brand-deep)] hover:underline">
                Compare plans
              </Link>
              {" · "}
              Pro keeps every future scan full; ₹60 unlocks this brief once.
            </p>
          </div>
        </div>
        <UpgradeInterestModal
          open={interest !== null}
          intent={interest ?? "pro"}
          onClose={() => setInterest(null)}
        />
      </section>
    );
  }

  return (
    <section className="mt-12 animate-rise">
      {showNextSteps && scan.status === "done" && (
        <div className="surface mb-8 bg-[var(--brand-soft)]/35">
          <div className="px-5 py-5 sm:px-6">
            <p className="kicker">What now</p>
            <h3 className="mt-1 display text-xl">
              {allClear ? "Looks solid — share or recheck later" : "Fix the top items, then rescan"}
            </h3>
            {!allClear && topFixes.length > 0 && (
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-[var(--ink)]/90">
                {topFixes.map((f) => (
                  <li key={`${f.agent}-${f.title}`}>
                    <span className="font-medium">{f.title}</span>
                    {f.fix ? <span className="text-[var(--muted)]"> — {f.fix}</span> : null}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/#scan" className="btn-primary">
                New scan
              </Link>
              <Link href={`/?url=${encodeURIComponent(scan.url)}#scan`} className="btn-secondary">
                Scan again
              </Link>
              <button type="button" onClick={() => void onCopy()} className="btn-secondary">
                {copied ? "Link copied" : "Share link"}
              </button>
              <a
                href={`/v1/scans/${scan.id}/report.html`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                HTML / PDF
              </a>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRescan()}
                className="btn-secondary"
              >
                {busy ? "Rescanning…" : user ? "Rescan" : "Sign in to rescan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-3xl">Results</h2>
          <p className="mt-1 text-[var(--muted)]">
            {allClear
              ? "No issues in this detect-only pass"
              : `${actionable.length} priority · ${findings.length} listed`}{" "}
            · {scan.status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)]/80 bg-white/50 p-1">
          <Action href="/#scan">New scan</Action>
          <Action href={`/?url=${encodeURIComponent(scan.url)}#scan`}>Scan again</Action>
          <Action onClick={() => void onCopy()}>{copied ? "Copied" : "Copy link"}</Action>
          <Action href={`/v1/scans/${scan.id}/report.html`}>HTML / PDF</Action>
          {report && (
            <Action href={`/v1/scans/${scan.id}/report.md`} download>
              Markdown
            </Action>
          )}
          {scan.status === "done" && (
            <Action disabled={busy} onClick={() => void onRescan()}>
              {busy ? "Rescanning…" : user ? "Rescan" : "Sign in to rescan"}
            </Action>
          )}
        </div>
      </div>

      {diffText && !actionError && (
        <p className="mb-4 text-sm text-[var(--muted)]">{diffText}</p>
      )}
      {actionError && (
        <RetryBanner
          message={actionError}
          busy={busy || unlockBusy}
          retryLabel="Retry action"
          onRetry={() => {
            setActionError("");
            void onRescan();
          }}
        />
      )}

      <div className="mb-8">
        <h3 className="display text-2xl">What we checked</h3>
        {summary.stack && (
          <p className="mt-1 text-xs text-[var(--muted)]">Detected stack: {summary.stack}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{summary.headline}</p>

        <ul className="mt-5">
          {(summary.agents || []).map((row) => (
            <li
              key={row.agent}
              className="grid gap-1 border-t border-[var(--line)]/80 py-3 text-sm sm:grid-cols-[6.5rem_11rem_1fr] sm:items-baseline sm:gap-3"
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  row.status === "attention" ? "text-[var(--warn)]" : "text-[var(--brand-deep)]"
                }`}
              >
                {row.status === "attention" ? "Attention" : "Clear"}
              </span>
              <span className="font-medium text-[var(--ink)]">{row.label}</span>
              <span className="text-[var(--muted)]">{row.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {scan.risk_path && !allClear && (
        <div className="mb-8">
          <h3 className="display text-xl">How this could be abused</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            High-level story for your team — not an exploit guide.
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)]">
            {scan.risk_path
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => {
                const isPriority = line.toLowerCase().startsWith("priority fix");
                const cleaned = line.replace(/^\d+[.)]\s*/, "");
                if (isPriority) {
                  return (
                    <li key={i} className="-ml-5 mt-2 list-none font-medium text-[var(--brand-deep)]">
                      {cleaned}
                    </li>
                  );
                }
                return <li key={i}>{cleaned}</li>;
              })}
          </ol>
        </div>
      )}

      {findings.length > 0 && (
        <>
          <h3 className="mb-4 display text-xl">Findings that need a look</h3>
          <ul className="flex flex-col gap-6">
            {findings.map((f: Finding, i: number) => (
              <li
                key={`${f.agent}-${f.title}-${i}`}
                className="border-t border-[var(--line)]/80 pt-5 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${sevClass(f.severity)}`}
                  >
                    {f.severity}
                  </span>
                  <span className="font-mono text-xs text-[var(--muted)]">{f.agent}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">{f.title}</h3>
                {f.evidence_url && (
                  <a
                    href={f.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block break-all font-mono text-xs text-[var(--brand)]"
                  >
                    {f.evidence_url}
                  </a>
                )}
                {f.evidence_snippet && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-white/70 p-3 font-mono text-xs text-[var(--muted)] whitespace-pre-wrap">
                    {f.evidence_snippet}
                  </pre>
                )}
                {f.explanation && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                    <span className="font-semibold text-[var(--brand-deep)]">Why it matters:</span>{" "}
                    {f.explanation}
                  </p>
                )}
                {f.fix && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                    <span className="font-semibold">Fix:</span> {f.fix}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {report && (
        <details className="mt-10 group">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-deep)] transition group-open:text-[var(--ink)]">
            Full markdown brief
          </summary>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--muted)]">
            {report}
          </pre>
        </details>
      )}
    </section>
  );
}
