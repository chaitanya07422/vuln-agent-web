export function StatusChip({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "brand" | "accent" | "warn" | "danger" | "muted";
}) {
  return <span className={`chip chip-${tone}`}>{label}</span>;
}

export function statusToneForScan(status: string, verdict?: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "running" || s === "queued") return "accent" as const;
  if (s === "failed") return "danger" as const;
  const v = (verdict || s || "").toLowerCase();
  if (v === "looks_solid") return "brand" as const;
  if (v === "minor_notes") return "warn" as const;
  if (v === "issues_found") return "danger" as const;
  if (s === "done") return "brand" as const;
  return "muted" as const;
}

export function statusLabelForScan(status: string, verdict?: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "queued") return "Queued";
  if (s === "running") return "Running";
  if (s === "failed") return "Failed";
  const v = (verdict || "").toLowerCase();
  switch (v) {
    case "looks_solid":
      return "Looks solid";
    case "minor_notes":
      return "Minor notes";
    case "issues_found":
      return "Issues found";
    default:
      return s === "done" ? "Complete" : s || "Scan";
  }
}
