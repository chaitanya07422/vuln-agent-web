"use client";

const DONE = [
  "Recon & fingerprint",
  "TLS & security headers",
  "Secrets in public JS",
  "Email auth (SPF/DMARC)",
];

const UP_NEXT = ["CSRF form hygiene", "Unauth access hints", "SSRF parameter hints"];

export function HomeSpecialistMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(19,32,26,0.04)]"
      aria-hidden
    >
      <div className="flex items-end justify-between gap-3 border-b border-[var(--line)]/80 px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
            Live engagement
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
            Specialists on target
          </p>
        </div>
        <p className="font-mono text-xl tabular-nums text-[var(--ink)]">
          38<span className="text-sm text-[var(--muted)]">%</span>
        </p>
      </div>

      <div className="relative h-1.5 bg-[var(--brand-soft)]">
        <div className="h-full w-[38%] bg-[var(--brand)]" />
        <div className="scan-beam" />
      </div>

      <div className="border-b border-[var(--line)]/70 bg-[var(--brand-soft)]/35 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
              Now probing
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
              Cookie security flags
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[var(--brand-deep)]">
              <span className="opacity-50">›</span>
              <span className="scan-type">reading Set-Cookie attributes</span>
              <span className="scan-caret" />
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-[var(--line)]/70 px-4 py-4 sm:border-b-0 sm:border-r sm:px-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Activity log
          </p>
          <div className="space-y-0.5 font-mono text-[12px]">
            {DONE.map((label, i) => (
              <div
                key={label}
                className="scan-log-row flex gap-2 px-1 py-1 text-[var(--ink)]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-[var(--brand)]">✓</span>
                <span>
                  <span className="text-[var(--muted)]">ok</span> {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Up next
          </p>
          <ol className="space-y-2 text-sm text-[var(--muted)]">
            {UP_NEXT.map((label, idx) => (
              <li key={label} className="flex gap-2.5">
                <span className="font-mono text-[10px] tabular-nums text-[var(--line)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-medium text-[var(--ink)]/75">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
