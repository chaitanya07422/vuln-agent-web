"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { RetryBanner } from "@/components/RetryBanner";
import { StatusChip, statusLabelForScan, statusToneForScan } from "@/components/StatusChip";
import { useAuth } from "@/components/AuthProvider";
import {
  claimScan,
  getDiff,
  getReport,
  getScan,
  readClaimToken,
  retryScan,
  type Scan,
} from "@/lib/api";

const POLL_MS = 1200;
const MAX_TRANSIENT = 12;

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PublicScanPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { user, login } = useAuth();
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState("");
  const [diffText, setDiffText] = useState("");
  const [error, setError] = useState("");
  const [softError, setSoftError] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [retryBusy, setRetryBusy] = useState(false);
  const [hasClaimToken, setHasClaimToken] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const failsRef = useRef(0);

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
    failsRef.current = 0;

    function schedule(ms: number) {
      timer = setTimeout(() => {
        void load();
      }, ms);
    }

    async function load() {
      try {
        const current = await getScan(id);
        if (cancelled) return;
        failsRef.current = 0;
        setSoftError("");
        if (current.status !== "failed") setError("");
        setScan(current);
        setHasClaimToken(Boolean(current.claim_token || readClaimToken(current.id)));
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
          schedule(POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        failsRef.current += 1;
        const msg = err instanceof Error ? err.message : String(err);
        if (failsRef.current < MAX_TRANSIENT) {
          setSoftError(
            `Connection hiccup — retrying (${failsRef.current}/${MAX_TRANSIENT})…`,
          );
          schedule(Math.min(POLL_MS * failsRef.current, 5000));
        } else {
          setSoftError("");
          setError(msg || "Request failed");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, tryLoadReport, retryTick]);

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

  async function onRetryJob() {
    if (!scan) return;
    setRetryBusy(true);
    setError("");
    try {
      const updated = await retryScan(scan.id);
      setScan(updated);
      setReport("");
      failsRef.current = 0;
      setRetryTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetryBusy(false);
    }
  }

  const canClaim = Boolean(scan && !scan.owner_id && hasClaimToken);
  const stillLive = Boolean(scan && (scan.status === "queued" || scan.status === "running"));
  const scanFailed = scan?.status === "failed";
  const pollFailed = Boolean(error) && !scanFailed;
  const titleHost = scan?.url ? hostOf(scan.url) : "Loading…";
  const statusLabel = scan
    ? statusLabelForScan(scan.status, scan.summary?.verdict)
    : "Loading";
  const statusTone = scan
    ? statusToneForScan(scan.status, scan.summary?.verdict)
    : "muted";

  return (
    <PageShell>
      <div className="animate-rise">
        <p className="kicker">
          {stillLive ? "Live scan" : scanFailed ? "Failed scan" : "Security brief"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="display break-all text-3xl sm:text-4xl md:text-5xl">{titleHost}</h1>
          <StatusChip label={statusLabel} tone={statusTone} />
          {scan?.detail_level === "teaser" && <StatusChip label="Preview" tone="warn" />}
        </div>
        {scan?.url && (
          <p className="mt-2 max-w-3xl truncate font-mono text-xs text-[var(--muted)] sm:text-sm">
            {scan.url}
            {report && scan.status === "running" ? " · draft brief ready" : null}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/#scan" className="btn-primary">
            New scan
          </Link>
          {scan?.url ? (
            <Link
              href={`/?url=${encodeURIComponent(scan.url)}#scan`}
              className="btn-secondary"
            >
              Scan again
            </Link>
          ) : null}
          <Link href="/scans" className="btn-ghost">
            My scans
          </Link>
        </div>

        {diffText && (
          <p className="mt-5 rounded-xl border border-[var(--brand)]/15 bg-[var(--brand-soft)]/40 px-4 py-3 text-sm text-[var(--brand-deep)]">
            {diffText}
          </p>
        )}

        {softError && stillLive && (
          <RetryBanner
            tone="warn"
            message={softError}
            retryLabel="Retry now"
            onRetry={() => {
              failsRef.current = 0;
              setSoftError("");
              setRetryTick((n) => n + 1);
            }}
          />
        )}

        {pollFailed && (
          <RetryBanner
            message={error}
            retryLabel="Retry connection"
            onRetry={() => {
              setError("");
              setSoftError("");
              failsRef.current = 0;
              setRetryTick((n) => n + 1);
            }}
          />
        )}

        {scanFailed && (
          <RetryBanner
            message={error || "Scan failed on the server."}
            busy={retryBusy}
            retryLabel="Retry scan"
            onRetry={() => void onRetryJob()}
          />
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
          <div className="surface mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">Keep this brief</p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Save it to My scans so it follows your account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={claimBusy}
                onClick={() => void onClaim()}
                className="btn-primary"
              >
                {user ? (claimBusy ? "Saving…" : "Save to My scans") : "Sign in to save"}
              </button>
              {claimMsg && (
                <span className="text-sm text-[var(--muted)]">
                  {claimMsg}
                  {claimMsg.toLowerCase().includes("fail") ||
                  claimMsg.toLowerCase().includes("error") ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        className="font-medium text-[var(--brand-deep)] underline"
                        onClick={() => void onClaim()}
                      >
                        Retry save
                      </button>
                    </>
                  ) : null}
                </span>
              )}
            </div>
          </div>
        )}

        {scan &&
          !scanFailed &&
          (scan.status === "done" || (scan.findings && scan.findings.length > 0) || report) && (
            <ScanResults
              scan={scan}
              report={report}
              showNextSteps={scan.status === "done"}
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
