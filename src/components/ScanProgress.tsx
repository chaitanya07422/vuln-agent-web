"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AgentProgress } from "@/lib/api";
import { CHECK_CATALOG } from "@/lib/checks";

const FALLBACK: AgentProgress[] = CHECK_CATALOG.map((c) => ({
  agent: c.agent,
  label: c.label,
  status: "pending",
}));

const CATALOG_BY_AGENT = Object.fromEntries(CHECK_CATALOG.map((c) => [c.agent, c]));

function catalogHint(agent: string, label: string) {
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

function elapsed(started?: string | null, finished?: string | null) {
  if (!started) return null;
  const a = Date.parse(started);
  const b = finished ? Date.parse(finished) : Date.now();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  const sec = Math.round((b - a) / 1000);
  if (sec < 1) return "<1s";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function stepLine(row: AgentProgress) {
  const d = (row.detail || "").trim();
  if (d) return d;
  if (row.status === "running") return "starting…";
  if (row.status === "skipped") return "skipped for this stack";
  return catalogHint(row.agent, row.label);
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
  const running = visible.filter((r) => r.status === "running");
  const pending = visible.filter((r) => r.status === "pending");
  const finished = doneRows.length + failedRows.length;
  const total = visible.length || 1;
  const pct = Math.min(100, Math.round((finished / total) * 100));
  const host = hostFromUrl(targetUrl);

  const logRef = useRef<HTMLDivElement>(null);
  const prevDone = useRef(0);

  useEffect(() => {
    if (doneRows.length > prevDone.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    prevDone.current = doneRows.length;
  }, [doneRows.length]);

  const primary = running[0] || null;

  const liveHeadline = useMemo(() => {
    if (scanStatus === "queued") return "Waiting for a worker slot";
    if (running.length === 1) return running[0].label;
    if (running.length > 1) return `${running.length} specialists in parallel`;
    if (pending.length === 0) return "Wrapping up brief";
    return "Between checks";
  }, [scanStatus, running, pending.length]);

  return (
    <div className="mt-8 animate-rise">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(19,32,26,0.04)]">
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
              {running.length > 0 && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="text-[var(--accent)]">{running.length} active</span>
                </>
              )}
              {findingCount > 0 && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="text-[var(--warn)]">
                    {findingCount} signal{findingCount === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl tabular-nums tracking-tight text-[var(--ink)]">
              {pct}%
            </span>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              complete
            </p>
          </div>
        </div>

        <div className="relative h-1.5 bg-[var(--brand-soft)]">
          <div
            className="scan-bar-fill relative h-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(pct, scanStatus === "running" ? 3 : 0)}%` }}
          />
          {scanStatus === "running" && <div className="scan-beam" aria-hidden />}
        </div>

        {/* Active steps — exact agent work, not catalog fluff */}
        <div className="border-b border-[var(--line)]/70 bg-[var(--brand-soft)]/35 px-4 py-4 sm:px-5">
          {scanStatus === "queued" ? (
            <div className="flex items-center gap-3">
              <span className="scan-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{liveHeadline}</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
                  scan starts the moment a slot opens
                </p>
              </div>
            </div>
          ) : running.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                  Now probing
                </span>
                <span className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-tight text-[var(--ink)]">
                  {liveHeadline}
                </span>
              </div>
              <ul className="space-y-2">
                {running.map((row) => (
                  <li
                    key={row.agent}
                    className="rounded-lg border border-[var(--line)]/70 bg-white/70 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-35" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                      </span>
                      <span className="text-sm font-semibold text-[var(--ink)]">{row.label}</span>
                      <span className="font-mono text-[10px] text-[var(--muted)]">
                        agent/{row.agent}
                      </span>
                      {elapsed(row.started_at) && (
                        <span className="ml-auto font-mono text-[10px] tabular-nums text-[var(--muted)]">
                          {elapsed(row.started_at)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 font-mono text-[12px] leading-snug text-[var(--brand-deep)]">
                      <span className="mt-0.5 shrink-0 opacity-45">›</span>
                      <span className="min-w-0 break-all">
                        {stepLine(row)}
                        <span className="scan-caret" aria-hidden />
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              {primary && !primary.detail && (
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  waiting for first request from agent…
                </p>
              )}
            </div>
          ) : pending.length === 0 ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">{liveHeadline}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="scan-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <p className="font-mono text-xs text-[var(--muted)]">
                <span className="opacity-50">›</span> advancing queue…
                <span className="scan-caret ml-0.5" aria-hidden />
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Activity log
            </p>
            <p className="font-mono text-[10px] text-[var(--muted)]">
              {doneRows.length} cleared
              {failedRows.length > 0 ? ` · ${failedRows.length} failed` : ""}
              {pending.length > 0 ? ` · ${pending.length} left` : ""}
            </p>
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
                    <span className="shrink-0 text-[var(--brand)]">
                      {row.status === "skipped" ? "–" : "✓"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[var(--muted)]">
                        {row.status === "skipped" ? "skip" : "ok"}
                      </span>{" "}
                      <span className="font-medium">{row.label}</span>
                      {row.detail && row.status !== "skipped" && (
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                          {row.detail}
                        </span>
                      )}
                    </span>
                    {elapsed(row.started_at, row.finished_at) && (
                      <span className="shrink-0 tabular-nums text-[10px] text-[var(--muted)]">
                        {elapsed(row.started_at, row.finished_at)}
                      </span>
                    )}
                  </div>
                ))}
                {failedRows.map((row) => (
                  <div
                    key={`${row.agent}-fail`}
                    className="scan-log-row flex gap-2 rounded-md px-1.5 py-1 text-[var(--danger)]"
                  >
                    <span className="shrink-0">✗</span>
                    <span className="min-w-0 flex-1">
                      <span className="opacity-70">fail</span> {row.label}
                      {row.detail && (
                        <span className="mt-0.5 block truncate text-[11px] opacity-80">
                          {row.detail}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
