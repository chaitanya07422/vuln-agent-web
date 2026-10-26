"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentProgress } from "@/lib/api";
import { CHECK_CATALOG } from "@/lib/checks";

const FALLBACK: AgentProgress[] = CHECK_CATALOG.map((c) => ({
  agent: c.agent,
  label: c.label,
  status: "pending",
}));

const CATALOG_BY_AGENT = Object.fromEntries(CHECK_CATALOG.map((c) => [c.agent, c]));

const TICKER = [
  "probing headers",
  "fingerprinting stack",
  "reading public JS",
  "checking DNS records",
  "mapping auth surfaces",
  "walking robots paths",
  "reviewing TLS handshake",
  "looking for leaky files",
];

function doesFor(agent: string, label: string) {
  return CATALOG_BY_AGENT[agent]?.does || label;
}

function hostFromUrl(url?: string | null) {
  if (!url) return "target";
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "target";
  }
}

export function ScanProgress({
  rows,
  scanStatus,
  targetUrl,
  findingCount = 0,
}: {
  rows?: AgentProgress[] | null;
  scanStatus: string;
  targetUrl?: string | null;
  findingCount?: number;
}) {
  const visible = rows && rows.length ? rows : FALLBACK;
  const doneRows = visible.filter((r) => r.status === "done" || r.status === "skipped");
  const failedRows = visible.filter((r) => r.status === "failed");
  const running = visible.find((r) => r.status === "running");
  const pending = visible.filter((r) => r.status === "pending");
  const finished = doneRows.length + failedRows.length;
  const total = visible.length || 1;
  const pct = Math.min(100, Math.round((finished / total) * 100));
  const host = hostFromUrl(targetUrl);

  const [tick, setTick] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const prevDone = useRef(0);

  useEffect(() => {
    if (scanStatus === "queued") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2200);
    return () => window.clearInterval(id);
  }, [scanStatus]);

  useEffect(() => {
    if (doneRows.length > prevDone.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    prevDone.current = doneRows.length;
  }, [doneRows.length]);

  const tickerLine = useMemo(() => {
    if (scanStatus === "queued") return "waiting for worker slot…";
    if (running) return doesFor(running.agent, running.label).toLowerCase();
    return TICKER[tick % TICKER.length];
  }, [scanStatus, running, tick]);

  const upcoming = pending.slice(0, 4);
  const morePending = Math.max(0, pending.length - upcoming.length);

  return (
    <div className="mt-8 animate-rise">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(19,32,26,0.04)]">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)]/80 px-4 py-3.5 sm:px-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
              Live engagement
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
              {scanStatus === "queued" ? "Queued" : "Specialists on target"}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
              <span className="text-[var(--brand-deep)]">{host}</span>
              <span className="mx-1.5 opacity-40">·</span>
              {finished}/{total} checks
              {findingCount > 0 && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="text-[var(--warn)]">{findingCount} signal{findingCount === 1 ? "" : "s"}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl tabular-nums tracking-tight text-[var(--ink)]">{pct}%</span>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">complete</p>
          </div>
        </div>

        {/* Progress bar with scan shimmer */}
        <div className="relative h-1.5 bg-[var(--brand-soft)]">
          <div
            className="scan-bar-fill relative h-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(pct, scanStatus === "running" ? 3 : 0)}%` }}
          />
          {scanStatus === "running" && <div className="scan-beam" aria-hidden />}
        </div>

        {/* Active agent spotlight */}
        <div className="border-b border-[var(--line)]/70 bg-[var(--brand-soft)]/35 px-4 py-4 sm:px-5">
          {scanStatus === "queued" ? (
            <div className="flex items-center gap-3">
              <span className="scan-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Waiting for a worker</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
                  scan will start the moment a slot opens
                </p>
              </div>
            </div>
          ) : running ? (
            <div className="flex items-start gap-3">
              <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                    Now probing
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    agent/{running.agent}
                  </span>
                </div>
                <p className="mt-1 font-[family-name:var(--font-display)] text-lg leading-snug tracking-tight text-[var(--ink)]">
                  {running.label}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{doesFor(running.agent, running.label)}</p>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[var(--brand-deep)]">
                  <span className="opacity-50">›</span>
                  <span className="scan-type">{tickerLine}</span>
                  <span className="scan-caret" aria-hidden />
                </p>
              </div>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">Wrapping up brief…</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="scan-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <p className="font-mono text-xs text-[var(--muted)]">
                <span className="opacity-50">›</span> {tickerLine}
                <span className="scan-caret ml-0.5" aria-hidden />
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
          {/* Activity log — completed one by one */}
          <div className="border-b border-[var(--line)]/70 px-4 py-4 sm:px-5 lg:border-b-0 lg:border-r">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Activity log
              </p>
              <p className="font-mono text-[10px] text-[var(--muted)]">{doneRows.length} cleared</p>
            </div>
            <div
              ref={logRef}
              className="scan-log max-h-56 space-y-0.5 overflow-y-auto pr-1 font-mono text-[12px] leading-relaxed sm:max-h-64"
            >
              {doneRows.length === 0 && failedRows.length === 0 ? (
                <p className="py-6 text-center text-[var(--muted)]">
                  {scanStatus === "queued"
                    ? "No checks started yet."
                    : "First specialist spinning up…"}
                </p>
              ) : (
                <>
                  {doneRows.map((row, i) => (
                    <div
                      key={`${row.agent}-done`}
                      className="scan-log-row flex gap-2 rounded-md px-1.5 py-1 text-[var(--ink)]"
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    >
                      <span className="shrink-0 text-[var(--brand)]">✓</span>
                      <span className="min-w-0 truncate">
                        <span className="text-[var(--muted)]">ok</span>{" "}
                        <span className="font-medium">{row.label}</span>
                      </span>
                    </div>
                  ))}
                  {failedRows.map((row) => (
                    <div
                      key={`${row.agent}-fail`}
                      className="scan-log-row flex gap-2 rounded-md px-1.5 py-1 text-[var(--danger)]"
                    >
                      <span className="shrink-0">✗</span>
                      <span className="min-w-0 truncate">
                        <span className="opacity-70">fail</span> {row.label}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Queue — what's next */}
          <div className="px-4 py-4 sm:px-5">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Up next
            </p>
            {upcoming.length === 0 ? (
              <p className="py-4 font-mono text-xs text-[var(--muted)]">
                {finished >= total ? "Queue empty — finishing report." : "Standing by…"}
              </p>
            ) : (
              <ol className="space-y-2">
                {upcoming.map((row, idx) => (
                  <li
                    key={row.agent}
                    className="flex items-start gap-2.5 text-sm text-[var(--muted)]"
                  >
                    <span className="mt-0.5 font-mono text-[10px] tabular-nums text-[var(--line)]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-medium text-[var(--ink)]/75">{row.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug opacity-80">
                        {doesFor(row.agent, row.label)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {morePending > 0 && (
              <p className="mt-3 font-mono text-[11px] text-[var(--muted)]">
                +{morePending} more in queue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
