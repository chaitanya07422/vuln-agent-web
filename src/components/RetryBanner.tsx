"use client";

type Tone = "danger" | "warn";

export function RetryBanner({
  message,
  onRetry,
  busy = false,
  retryLabel = "Retry",
  tone = "danger",
}: {
  message: string;
  onRetry: () => void;
  busy?: boolean;
  retryLabel?: string;
  tone?: Tone;
}) {
  const box =
    tone === "warn"
      ? "border-amber-200/80 bg-amber-50/80 text-[var(--warn)]"
      : "border-red-200/80 bg-red-50/80 text-[var(--danger)]";
  return (
    <div className={`mt-4 animate-rise rounded-xl border px-4 py-3 text-sm ${box}`}>
      <p>{message}</p>
      <button
        type="button"
        disabled={busy}
        onClick={onRetry}
        className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] disabled:opacity-50"
      >
        {busy ? "Retrying…" : retryLabel}
      </button>
    </div>
  );
}
