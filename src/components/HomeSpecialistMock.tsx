"use client";

const DONE = [
  "Recon & fingerprint",
  "TLS & security headers",
  "Secrets in public JS",
  "Email auth (SPF/DMARC)",
];

export function HomeSpecialistMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(19,32,26,0.04)]"
      aria-hidden
    >
      <div className="flex items-end justify-between gap-3 border-b border-[var(--line)]/80 px-4 py-3.5 sm:px-5">
        <div>
          <p className="kicker">Live engagement</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
            Specialists on target
          </p>
          <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
            <span className="text-[var(--brand-deep)]">example.com</span>
            <span className="mx-1.5 opacity-40">·</span>
            4/11 checks
            <span className="mx-1.5 opacity-40">·</span>
            <span className="text-[var(--accent)]">1 active</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl tabular-nums tracking-tight text-[var(--ink)]">38%</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            complete
          </p>
        </div>
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
              <span className="scan-type">get → /login · reading Set-Cookie</span>
              <span className="scan-caret" />
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Activity log
          </p>
          <p className="font-mono text-[10px] text-[var(--muted)]">4 cleared · 7 left</p>
        </div>
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
    </div>
  );
}
