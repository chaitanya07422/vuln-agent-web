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
      ? "border-amber-200/80 bg-amber-50/90 text-[var(--warn)]"
      : "border-red-200/80 bg-red-50/90 text-[var(--danger)]";
  return (
    <div
      className={`mt-5 flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${box}`}
    >
      <p className="text-sm leading-relaxed">{message}</p>
      <button
        type="button"
        disabled={busy}
        onClick={onRetry}
        className="btn-primary shrink-0 self-start sm:self-auto"
      >
        {busy ? "Retrying…" : retryLabel}
      </button>
    </div>
  );
}
