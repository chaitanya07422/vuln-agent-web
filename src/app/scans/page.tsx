"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { listMyScans, readGuestScans, type ScanListItem } from "@/lib/api";

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

  return (
    <PageShell>
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4 pt-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
            My scans
          </h1>
          <p className="mt-2 text-[var(--muted)]">Saved briefs for your Google account.</p>
        </div>
        {user && (
          <p className="text-sm text-[var(--muted)]">
            {plan} · {scans.length}/{limit}
            {plan === "free" && scans.length >= limit && (
              <>
                {" · "}
                <Link href="/pricing" className="text-[var(--brand-deep)] underline-offset-2 hover:underline">
                  Upgrade
                </Link>
              </>
            )}
          </p>
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
        <ul className="animate-rise-delay mt-10 divide-y divide-[var(--line)]/80">
          {scans.map((s) => {
            const verdict = s.summary?.verdict || s.status;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/scan/${s.id}`}
                    className="block truncate font-medium text-[var(--ink)] hover:text-[var(--brand-deep)]"
                  >
                    {s.url}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    {new Date(s.created_at).toLocaleString()} · {verdict}
                    {s.parent_scan_id ? " · rescan" : ""}
                  </p>
                </div>
                <Link
                  href={`/scan/${s.id}`}
                  className="text-sm font-medium text-[var(--brand-deep)] hover:underline"
                >
                  Open
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
              {g.url}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
