"use client";

import { useState } from "react";

export const MCP_SAMPLE_PROMPT = `Use the ScanLead MCP tools to run a detect-only vulnerability scan on https://example.com.

I own / am authorized to test this site — set attested to true when you start the scan.

Do this end-to-end:
1. Check my remaining quota with get_quota
2. Start the scan with start_scan
3. Poll get_scan until status is done (or failed)
4. Fetch get_brief and summarize the top findings, severity, and recommended fixes

Only use ScanLead MCP tools — do not invent findings. If the scan fails, try retry_scan once and report the error clearly.`;

export function McpSamplePrompt({ dark = false }: { dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(MCP_SAMPLE_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={
        dark
          ? "rounded-2xl border border-white/15 bg-[var(--ink)]/40 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6"
          : "rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={
            dark
              ? "font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
              : "kicker"
          }
        >
          Sample prompt
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className={
            dark
              ? "rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
              : "btn-secondary min-h-0 px-2.5 py-1 text-xs"
          }
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        className={
          dark
            ? "mt-3 text-sm leading-relaxed text-[#d5ebe1]"
            : "mt-3 text-sm leading-relaxed text-[var(--ink)]"
        }
      >
        Paste into your agent (swap in your URL):
      </p>
      <pre
        className={
          dark
            ? "mt-3 whitespace-pre-wrap rounded-xl bg-black/35 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-[#e8f0eb]"
            : "mt-3 whitespace-pre-wrap rounded-xl bg-[var(--bg)] px-3.5 py-3 font-mono text-[12px] leading-relaxed text-[var(--ink)]"
        }
      >
        {MCP_SAMPLE_PROMPT}
      </pre>
    </div>
  );
}
