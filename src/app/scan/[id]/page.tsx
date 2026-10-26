"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { getDiff, getReport, getScan, type Scan } from "@/lib/api";

export default function PublicScanPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState("");
  const [diffText, setDiffText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const current = await getScan(id);
        if (cancelled) return;
        setScan(current);
        if (current.status === "done") {
          try {
            const md = await getReport(id);
            if (!cancelled) setReport(md);
          } catch {
            /* optional */
          }
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
  }, [id]);

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

        {scan && (scan.status === "done" || (scan.findings && scan.findings.length > 0)) && (
          <ScanResults scan={scan} report={report} />
        )}
      </div>
    </PageShell>
  );
}
