"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { useAuth } from "@/components/AuthProvider";
import {
  claimScan,
  getDiff,
  getReport,
  getScan,
  readClaimToken,
  type Scan,
} from "@/lib/api";

export default function PublicScanPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { user, login } = useAuth();
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState("");
  const [diffText, setDiffText] = useState("");
  const [error, setError] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [hasClaimToken, setHasClaimToken] = useState(false);

  const tryLoadReport = useCallback(async (scanId: string) => {
    try {
      const md = await getReport(scanId);
      if (md) setReport(md);
    } catch {
      /* draft not ready yet */
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const current = await getScan(id);
        if (cancelled) return;
        setScan(current);
        setHasClaimToken(Boolean(current.claim_token || readClaimToken(current.id)));
        // Draft brief may exist while still running (template before LLM polish).
        if (current.status === "running" || current.status === "done") {
          void tryLoadReport(id);
        }
        if (current.status === "done") {
          if (current.parent_scan_id) {
            try {
              const d = await getDiff(current.parent_scan_id, id);
              const c = d.diff?.counts || {};
              if (!cancelled) {
                setDiffText(
                  `Compared to prior scan: +${c.new || 0} new · −${c.fixed || 0} fixed · ${c.still_open || 0} still open`,
                );
              }
            } catch {
              /* ignore */
            }
          }
        } else if (current.status === "failed") {
          setError(current.error || "Scan failed");
        } else {
          timer = setTimeout(load, 1200);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, tryLoadReport]);

  async function onClaim() {
    if (!scan) return;
    if (!user) {
      login();
      return;
    }
    const token = scan.claim_token || readClaimToken(scan.id);
    if (!token) {
      setClaimMsg("Already saved or claim token expired.");
      return;
    }
    setClaimBusy(true);
    setClaimMsg("");
    try {
      const updated = await claimScan(scan.id, token);
      setScan(updated);
      setClaimMsg("Saved to My scans.");
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setClaimBusy(false);
    }
  }

  const canClaim = Boolean(scan && !scan.owner_id && hasClaimToken);

  return (
    <PageShell>
      <div className="animate-rise pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand)]">
          Shared scan
        </p>
        <h1 className="mt-2 break-all font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          {scan?.url || "Loading…"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--brand-deep)] hover:underline">
            Run your own scan
          </Link>
          {scan && (
            <>
              {" · "}
              <span className="font-mono">{scan.status}</span>
              {report && scan.status === "running" ? " · draft brief ready" : null}
            </>
          )}
        </p>

        {diffText && <p className="mt-4 text-sm text-[var(--brand-deep)]">{diffText}</p>}
        {error && (
          <p className="mt-6 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {scan && (scan.status === "queued" || scan.status === "running") && (
          <ScanProgress
            rows={scan.agents_progress}
            scanStatus={scan.status}
            targetUrl={scan.url}
            findingCount={scan.findings?.length ?? 0}
          />
        )}

        {canClaim && (scan?.status === "done" || Boolean(report)) && (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink)]">
            <span className="text-[var(--muted)]">Keep this brief in your account.</span>
            <button
              type="button"
              disabled={claimBusy}
              onClick={() => void onClaim()}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
            >
              {user ? (claimBusy ? "Saving…" : "Save to My scans") : "Sign in to save"}
            </button>
            {claimMsg && <span className="text-[var(--muted)]">{claimMsg}</span>}
          </div>
        )}

        {scan && (scan.status === "done" || (scan.findings && scan.findings.length > 0) || report) && (
          <ScanResults
            scan={scan}
            report={report}
            onScanUpdate={(updated) => {
              setScan(updated);
              if (updated.detail_level !== "teaser") {
                void tryLoadReport(updated.id);
              }
            }}
          />
        )}
      </div>
    </PageShell>
  );
}
