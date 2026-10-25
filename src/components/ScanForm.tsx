"use client";

import { FormEvent, useState } from "react";
import { createScan, getReport, getScan, type Finding, type Scan } from "@/lib/api";
import { ScanResults } from "@/components/ScanResults";

type Phase = "idle" | "running" | "done" | "error";

export function ScanForm() {
  const [url, setUrl] = useState("");
  const [attested, setAttested] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Ready when you are.");
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setReport("");
    setScan(null);
    setPhase("running");
    setStatus("Starting authorized scan…");

    try {
      const created = await createScan(url.trim(), attested);
      setScan(created);
      setStatus(`Scan ${created.id.slice(0, 8)}… running specialist agents`);

      let final: Scan | null = null;
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const current = await getScan(created.id);
        setScan(current);
        const count = current.findings?.length ?? 0;
        setStatus(`status: ${current.status} · findings: ${count}`);
        if (current.status === "done" || current.status === "failed") {
          final = current;
          break;
        }
      }

      if (!final) throw new Error("Scan timed out. Try again in a minute.");
      if (final.status === "failed") throw new Error(final.error || "Scan failed");

      const md = await getReport(final.id);
      setReport(md);
      setPhase("done");
      setStatus("Scan complete.");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Could not complete the scan.");
    }
  }

  const findings: Finding[] = scan?.findings ?? [];

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="animate-rise-delay-2 flex w-full flex-col gap-4">
        <label className="text-sm font-medium text-[var(--muted)]" htmlFor="target-url">
          Website URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="target-url"
            type="url"
            required
            placeholder="https://your-company.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-h-14 flex-1 rounded-xl border border-[var(--line)] bg-white px-4 text-base text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[#9aaca3] focus:ring-2"
          />
          <button
            type="submit"
            disabled={phase === "running" || !attested}
            className="min-h-14 rounded-xl bg-[var(--brand)] px-7 text-base font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {phase === "running" ? "Scanning…" : "Start scan"}
          </button>
        </div>

        <label className="flex max-w-2xl cursor-pointer items-start gap-3 text-sm leading-snug text-[var(--muted)]">
          <input
            type="checkbox"
            checked={attested}
            onChange={(e) => setAttested(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            required
          />
          <span>
            I own this website or have written authorization to test it. Scans are detect-only —
            no password sprays or exploitation.
          </span>
        </label>
      </form>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3 font-mono text-sm text-[var(--muted)]">
        {phase === "running" && (
          <span className="scan-pulse inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        )}
        <span>{status}</span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {(phase === "done" || (phase === "running" && findings.length > 0)) && scan && (
        <ScanResults scan={scan} report={report} />
      )}
    </div>
  );
}
