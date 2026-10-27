"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { PlanBadge } from "@/components/PlanBadge";
import { StatusChip, statusLabelForScan, statusToneForScan } from "@/components/StatusChip";
import { listMyScans, readGuestScans, type ScanListItem } from "@/lib/api";
import { RetryBanner } from "@/components/RetryBanner";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function MyScansPage() {
  const { user, loading, login } = useAuth();
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [limit, setLimit] = useState(10);
  const [plan, setPlan] = useState("free");
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<{ id: string; url: string; at: string }[]>([]);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setGuest(readGuestScans());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setError("");
        const data = await listMyScans();
        if (!cancelled) {
          setScans(data.scans || []);
          setLimit(data.limit);
          setPlan(data.plan);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reloadTick]);

  const usagePct = limit > 0 ? Math.min(100, Math.round((scans.length / limit) * 100)) : 0;
  const nearLimit = plan === "free" && scans.length >= Math.max(1, limit - 2);

  return (
    <PageShell>
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Library</p>
          <h1 className="mt-2 display text-4xl sm:text-5xl">My scans</h1>
          <p className="mt-2 text-[var(--muted)]">Saved briefs for your Google account.</p>
        </div>
        {user && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[10rem]">
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <PlanBadge plan={plan} size="sm" />
                <span className="font-mono tabular-nums">
                  {scans.length}/{limit}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--brand-soft)]">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    nearLimit ? "bg-[var(--warn)]" : "bg-[var(--brand)]"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              {nearLimit && (
                <Link
                  href="/pricing"
                  className="mt-2 inline-block text-xs font-medium text-[var(--brand-deep)] hover:underline"
                >
                  Upgrade for more
                </Link>
              )}
            </div>
            <Link href="/#scan" className="btn-primary">
              New scan
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-8 font-mono text-sm text-[var(--muted)]">Loading…</p>
      ) : !user ? (
        <div className="animate-rise-delay surface mt-8 max-w-lg p-6 sm:p-8">
          <p className="display text-2xl">Sign in to keep briefs</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Guest scans stay on this device until you claim them. Sign in to sync history across
            browsers.
          </p>
          <button type="button" onClick={login} className="btn-primary mt-6">
            Continue with Google
          </button>
          <GuestRecent guest={guest} />
        </div>
      ) : error ? (
        <RetryBanner
          message={error}
          retryLabel="Retry load"
          onRetry={() => setReloadTick((n) => n + 1)}
        />
      ) : scans.length === 0 ? (
        <div className="animate-rise-delay surface mt-10 max-w-lg p-6 sm:p-8">
          <p className="display text-2xl">No saved scans yet</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Run a detect-only pass from the home page — it saves automatically while you&apos;re
            signed in.
          </p>
          <Link href="/#scan" className="btn-primary mt-6 inline-flex">
            Start a scan
          </Link>
          <GuestRecent guest={guest} />
        </div>
      ) : (
        <ul className="animate-rise-delay surface mt-10 divide-y divide-[var(--line)]/70">
          {scans.map((s) => {
            const host = hostOf(s.url);
            const label = statusLabelForScan(s.status, s.summary?.verdict);
            const tone = statusToneForScan(s.status, s.summary?.verdict);
            return (
              <li key={s.id}>
                <Link
                  href={`/scan/${s.id}`}
                  className="group flex items-start gap-4 px-4 py-4 transition hover:bg-[var(--brand-soft)]/25 sm:items-center sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="truncate text-[15px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand-deep)]">
                        {host}
                      </span>
                      <StatusChip label={label} tone={tone} />
                      {s.parent_scan_id && <StatusChip label="Rescan" tone="muted" />}
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{s.url}</p>
                    <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                      {formatWhen(s.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 pt-1 text-sm font-medium text-[var(--brand-deep)] opacity-60 transition group-hover:opacity-100 sm:pt-0">
                    View →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}

function GuestRecent({ guest }: { guest: { id: string; url: string; at: string }[] }) {
  if (!guest.length) return null;
  return (
    <div className="mt-8 border-t border-[var(--line)]/80 pt-6">
      <p className="kicker">On this device</p>
      <ul className="mt-3 space-y-2">
        {guest.map((g) => (
          <li key={g.id}>
            <Link
              href={`/scan/${g.id}`}
              className="text-sm font-medium text-[var(--brand-deep)] hover:underline"
            >
              {hostOf(g.url)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
