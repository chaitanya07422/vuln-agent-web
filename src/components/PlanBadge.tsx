export function PlanBadge({
  plan,
  size = "md",
}: {
  plan?: string | null;
  size?: "sm" | "md";
}) {
  const isPro = (plan || "free").toLowerCase() === "pro";
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const icon = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (!isPro) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white/80 font-semibold uppercase tracking-wide text-[var(--muted)] ${pad}`}
      >
        Free
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--brand)] font-semibold uppercase tracking-wide text-white shadow-sm ${pad}`}
      title="Pro plan"
    >
      <svg className={icon} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 1.5 9.9 5.4l4.3.4-3.3 2.9.9 4.2L8 11.1l-3.8 1.8.9-4.2L1.8 5.8l4.3-.4L8 1.5Z" />
      </svg>
      Pro
    </span>
  );
}
