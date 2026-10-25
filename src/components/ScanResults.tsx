"use client";

import type { Finding, Scan } from "@/lib/api";

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
  const findings = [...(scan.findings || [])].sort(
    (a, b) => ORDER.indexOf(a.severity as (typeof ORDER)[number]) - ORDER.indexOf(b.severity as (typeof ORDER)[number]),
  );
  const actionable = findings.filter((f) => ["critical", "high", "medium"].includes(f.severity));

  return (
    <section className="mt-10 animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            Results
          </h2>
          <p className="mt-1 text-[var(--muted)]">
            {actionable.length} priority finding{actionable.length === 1 ? "" : "s"} ·{" "}
            {findings.length} total · {scan.status}
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

      {scan.fingerprint && Object.keys(scan.fingerprint).length > 0 && (
        <div className="mb-6 rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-mono text-xs text-[var(--muted)]">
          fingerprint: {JSON.stringify(scan.fingerprint)}
        </div>
      )}

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
            {f.fix && <p className="mt-3 text-sm text-[var(--ink)]"><span className="font-semibold">Fix:</span> {f.fix}</p>}
          </li>
        ))}
      </ul>

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
