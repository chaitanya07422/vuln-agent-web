"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { PlanBadge } from "@/components/PlanBadge";
import { listMyScans, readGuestScans, type ScanListItem } from "@/lib/api";

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

function verdictMeta(raw: string | undefined, status: string) {
  const key = (raw || status || "").toLowerCase();
  if (status === "running" || status === "queued") {
    return { label: status === "queued" ? "Queued" : "Running", tone: "text-[var(--accent)] bg-[var(--brand-soft)]" };
  }
  if (status === "failed") {
    return { label: "Failed", tone: "text-[var(--danger)] bg-red-50" };
  }
  switch (key) {
    case "looks_solid":
      return { label: "Looks solid", tone: "text-[var(--brand-deep)] bg-[var(--brand-soft)]" };
    case "minor_notes":
      return { label: "Minor notes", tone: "text-[var(--warn)] bg-amber-50" };
    case "issues_found":
      return { label: "Issues found", tone: "text-[var(--danger)] bg-red-50" };
    case "done":
      return { label: "Complete", tone: "text-[var(--muted)] bg-white" };
    default:
      return {
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Scan",
        tone: "text-[var(--muted)] bg-white",
      };
  }
}

export default function MyScansPage() {
  const { user, loading, login } = useAuth();
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [limit, setLimit] = useState(10);
  const [plan, setPlan] = useState("free");
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<{ id: string; url: string; at: string }[]>([]);

  useEffect(() => {
    setGuest(readGuestScans());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
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
  }, [user]);

  const usagePct = limit > 0 ? Math.min(100, Math.round((scans.length / limit) * 100)) : 0;
  const nearLimit = plan === "free" && scans.length >= Math.max(1, limit - 2);

  return (
    <PageShell>
      <div className="animate-rise flex flex-wrap items-end justify-between gap-5 pt-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
            My scans
          </h1>
          <p className="mt-2 text-[var(--muted)]">Saved briefs for your Google account.</p>
        </div>
        {user && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[9.5rem]">
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <PlanBadge plan={plan} size="sm" />
                <span>
                  {scans.length}/{limit}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--brand-soft)]">
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
                  className="mt-1.5 inline-block text-xs font-medium text-[var(--brand-deep)] hover:underline"
                >
                  Upgrade for more
                </Link>
              )}
            </div>
            <Link
              href="/#scan"
              className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
            >
              New scan
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-14 font-mono text-sm text-[var(--muted)]">Loading…</p>
      ) : !user ? (
        <div className="animate-rise-delay mt-14 max-w-md">
          <p className="text-[var(--ink)]">Sign in to see scans saved to your account.</p>
          <button
            type="button"
            onClick={login}
            className="mt-5 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
          >
            Continue with Google
          </button>
          <GuestRecent guest={guest} />
        </div>
      ) : error ? (
        <p className="mt-14 text-sm text-[var(--danger)]">{error}</p>
      ) : scans.length === 0 ? (
        <div className="animate-rise-delay mt-14 max-w-md">
          <p className="text-[var(--ink)]">No saved scans yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Run a scan from the home page — it saves while you&apos;re signed in.
          </p>
          <Link
            href="/#scan"
            className="mt-5 inline-block rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
          >
            Start a scan
          </Link>
          <GuestRecent guest={guest} />
        </div>
      ) : (
        <ul className="animate-rise-delay mt-10">
          {scans.map((s) => {
            const v = verdictMeta(s.summary?.verdict, s.status);
            const host = hostOf(s.url);
            return (
              <li key={s.id}>
                <Link
                  href={`/scan/${s.id}`}
                  className="group flex items-start gap-4 border-t border-[var(--line)]/70 py-4 transition first:border-t-0 hover:bg-white/40 sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="truncate text-[15px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand-deep)]">
                        {host}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ${v.tone}`}
                      >
                        {v.label}
                      </span>
                      {s.parent_scan_id && (
                        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                          Rescan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{s.url}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatWhen(s.created_at)}</p>
                  </div>
                  <span className="shrink-0 pt-1 text-sm font-medium text-[var(--brand-deep)] opacity-70 transition group-hover:opacity-100 sm:pt-0">
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
    <div className="mt-10 border-t border-[var(--line)]/80 pt-6">
      <p className="text-sm font-medium text-[var(--muted)]">Recent on this device</p>
      <ul className="mt-3 space-y-2">
        {guest.map((g) => (
          <li key={g.id}>
            <Link href={`/scan/${g.id}`} className="text-[var(--brand-deep)] hover:underline">
              {hostOf(g.url)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
