"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Finding, Scan } from "@/lib/api";
import { getDiff, rescan } from "@/lib/api";
import { buildDisplaySummary } from "@/lib/checks";
import { useAuth } from "@/components/AuthProvider";

const ORDER = ["critical", "high", "medium", "low", "info"] as const;

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

export function ScanResults({ scan, report }: { scan: Scan; report: string }) {
  const { user, login } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [diffText, setDiffText] = useState("");
  const [actionError, setActionError] = useState("");

  const findings = [...(scan.findings || [])]
    .filter((f) => f.severity !== "info" && f.agent !== "reporter")
    .sort(
      (a, b) =>
        ORDER.indexOf(a.severity as (typeof ORDER)[number]) -
        ORDER.indexOf(b.severity as (typeof ORDER)[number]),
    );
  const actionable = findings.filter((f) => ["critical", "high", "medium"].includes(f.severity));
  const summary = buildDisplaySummary(scan);
  const allClear = Boolean(summary.all_clear);
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

  return (
    <section className="mt-12 animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            Results
          </h2>
          <p className="mt-1 text-[var(--muted)]">
            {allClear
              ? "No issues in this detect-only pass"
              : `${actionable.length} priority · ${findings.length} listed`}{" "}
            · {scan.status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)]/80 bg-white/50 p-1">
          <Action onClick={() => void onCopy()}>{copied ? "Copied" : "Copy link"}</Action>
          <Action href={`/v1/scans/${scan.id}/report.html`}>HTML / PDF</Action>
          {report && (
            <Action href={`/v1/scans/${scan.id}/report.md`} download>
              Markdown
            </Action>
          )}
          {scan.status === "done" && (
            <Action href={`/v1/scans/${scan.id}/audit.json`} download>
              Audit
            </Action>
          )}
          {scan.status === "done" && (
            <Action disabled={busy} onClick={() => void onRescan()}>
              {busy ? "Rescanning…" : user ? "Rescan" : "Sign in to rescan"}
            </Action>
          )}
        </div>
      </div>

      {(actionError || diffText) && (
        <p className="mb-4 text-sm text-[var(--muted)]">{actionError || diffText}</p>
      )}

      <div className="mb-8">
        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
          What we checked
        </h3>
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
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            How this could be abused
          </h3>
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
          <h3 className="mb-4 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            Findings that need a look
          </h3>
          <ul className="flex flex-col gap-6">
            {findings.map((f: Finding, i: number) => (
              <li key={`${f.agent}-${f.title}-${i}`} className="border-t border-[var(--line)]/80 pt-5 first:border-t-0 first:pt-0">
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
