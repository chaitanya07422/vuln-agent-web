"use client";

import type { AgentProgress } from "@/lib/api";
import { CHECK_CATALOG } from "@/lib/checks";

const FALLBACK: AgentProgress[] = CHECK_CATALOG.map((c) => ({
  agent: c.agent,
  label: c.label,
  status: "pending",
}));

function statusLabel(status: string) {
  switch (status) {
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "skipped":
      return "Skipped";
    case "failed":
      return "Failed";
    default:
      return "Waiting";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "running":
      return "text-[var(--accent)]";
    case "done":
      return "text-[var(--brand-deep)]";
    case "skipped":
      return "text-[var(--muted)]";
    case "failed":
      return "text-[var(--danger)]";
    default:
      return "text-[var(--muted)]";
  }
}

export function ScanProgress({
  rows,
  scanStatus,
}: {
  rows?: AgentProgress[] | null;
  scanStatus: string;
}) {
  const visible = rows && rows.length ? rows : FALLBACK;
  const done = visible.filter((r) => r.status === "done" || r.status === "skipped").length;
  const total = visible.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mt-6 animate-rise rounded-xl border border-[var(--line)] bg-white/90 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            Live checks
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {scanStatus === "queued" ? "Queued — waiting for a worker…" : "Specialists running now"}
          </p>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">
          {done}/{total} · {pct}%
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--brand-soft)]">
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-0">
        {visible.map((row) => (
          <li
            key={row.agent}
            className="grid gap-1 border-t border-[var(--line)] py-2.5 text-sm sm:grid-cols-[6.5rem_1fr] sm:items-center sm:gap-3"
          >
            <span
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${statusClass(row.status)}`}
            >
              {row.status === "running" && (
                <span className="scan-pulse inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              )}
              {statusLabel(row.status)}
            </span>
            <span className="font-medium text-[var(--ink)]">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
