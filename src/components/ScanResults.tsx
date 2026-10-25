"use client";

import type { Finding, Scan } from "@/lib/api";
import { buildDisplaySummary } from "@/lib/checks";

const ORDER = ["critical", "high", "medium", "low", "info"] as const;

function sevClass(sev: string) {
  switch (sev) {
    case "critical":
    case "high":
      return "bg-red-50 text-[var(--danger)] border-red-100";
    case "medium":
      return "bg-amber-50 text-[var(--warn)] border-amber-100";
    default:
      return "bg-[var(--brand-soft)] text-[var(--brand-deep)] border-emerald-100";
  }
}

export function ScanResults({ scan, report }: { scan: Scan; report: string }) {
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

  return (
    <section className="mt-10 animate-rise">
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
        <div className="flex flex-wrap gap-2">
          {report && (
            <a
              href={`/api/scans/${scan.id}/report`}
              download={`scanlead-${scan.id}.md`}
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-deep)] transition hover:border-[var(--brand)]"
            >
              Download report.md
            </a>
          )}
          {scan.status === "done" && (
            <a
              href={`/api/scans/${scan.id}/audit`}
              download={`scanlead-${scan.id}-audit.json`}
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand-deep)]"
            >
              Download audit.json
            </a>
          )}
        </div>
      </div>

      <div
        className={`mb-6 rounded-xl border px-5 py-5 ${
          allClear ? "border-emerald-200 bg-emerald-50/60" : "border-[var(--line)] bg-white"
        }`}
      >
        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
          What we checked
        </h3>
        {summary.stack && (
          <p className="mt-1 text-xs text-[var(--muted)]">Detected stack: {summary.stack}</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{summary.headline}</p>

        <ul className="mt-5 space-y-0">
          {(summary.agents || []).map((row) => (
            <li
              key={row.agent}
              className="grid gap-1 border-t border-[var(--line)] py-3 text-sm sm:grid-cols-[6.5rem_11rem_1fr] sm:items-baseline sm:gap-3"
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
        <div className="mb-6 rounded-xl border border-[var(--line)] bg-white px-5 py-4">
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
                    <li key={i} className="list-none -ml-5 mt-2 font-medium text-[var(--brand-deep)]">
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
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            Findings that need a look
          </h3>
          <ul className="flex flex-col gap-3">
            {findings.map((f: Finding, i: number) => (
              <li
                key={`${f.agent}-${f.title}-${i}`}
                className="rounded-xl border border-[var(--line)] bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${sevClass(f.severity)}`}
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
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--bg)] p-3 font-mono text-xs text-[var(--muted)] whitespace-pre-wrap">
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
        <details className="mt-8 rounded-xl border border-[var(--line)] bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-deep)]">
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
