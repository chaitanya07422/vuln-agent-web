import type { Finding, Scan, ScanSummary, AgentSummaryRow } from "@/lib/api";

/** Canonical checklist shown even if the API summary is missing (old server). */
export const CHECK_CATALOG: { agent: string; label: string; does: string }[] = [
  { agent: "recon", label: "Recon & fingerprint", does: "Reachability, headers, tech stack" },
  { agent: "js_audit", label: "Frontend JS review", does: "Bundles for upload/resume/MIME risks" },
  { agent: "users", label: "User / author exposure", does: "Public user listing (e.g. WP REST)" },
  { agent: "auth", label: "Auth surfaces", does: "XML-RPC / login-style endpoints" },
  { agent: "leaks", label: "Leaks & leftover files", does: ".env, git, backups, readme, docs" },
  { agent: "cors_api", label: "CORS & public APIs", does: "Origin reflection, open API docs" },
  { agent: "upload", label: "Upload & file routes", does: "Presign/upload JSON APIs, object URLs" },
  { agent: "uat_app", label: "Staging / UAT links", does: "Non-prod hosts linked from production" },
  { agent: "ports_mail", label: "Ports & mail", does: "Risky ports (not normal 80/443), mail hosts" },
  { agent: "adapt", label: "Extra path probes", does: "One-shot paths from stack + JS hints" },
];

export function buildDisplaySummary(scan: Scan): ScanSummary {
  if (scan.summary?.agents?.length) {
    return scan.summary;
  }

  const findings = (scan.findings || []).filter(
    (f) => f.severity !== "info" && f.agent !== "reporter",
  );
  const byAgent = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byAgent.get(f.agent) || [];
    list.push(f);
    byAgent.set(f.agent, list);
  }

  const fp = scan.fingerprint || {};
  const tags = Array.isArray(fp.tags) ? (fp.tags as string[]).join(", ") : "unknown";

  const agents: AgentSummaryRow[] = CHECK_CATALOG.map((c) => {
    const hits = (byAgent.get(c.agent) || []).filter((f) =>
      ["critical", "high", "medium", "low"].includes(f.severity),
    );
    if (hits.length) {
      return {
        agent: c.agent,
        label: c.label,
        status: "attention",
        note: hits.map((h) => h.title).slice(0, 2).join("; "),
      };
    }
    return {
      agent: c.agent,
      label: c.label,
      status: "clear",
      note: `Checked — ${c.does}`,
    };
  });

  const priority = findings.filter((f) => ["critical", "high", "medium"].includes(f.severity));
  const lows = findings.filter((f) => f.severity === "low");
  let verdict: ScanSummary["verdict"] = "looks_solid";
  let headline =
    "Everything checked looks solid — no critical, high, medium, or low issues in this detect-only pass.";
  let all_clear = true;
  if (priority.length) {
    verdict = "issues_found";
    headline = `Scan finished with ${priority.length} priority issue${priority.length === 1 ? "" : "s"} that need attention.`;
    all_clear = false;
  } else if (lows.length) {
    verdict = "minor_notes";
    headline = `No major vulnerabilities; ${lows.length} minor hygiene note${lows.length === 1 ? "" : "s"} remain.`;
    all_clear = false;
  }

  return {
    verdict,
    headline,
    all_clear,
    stack: tags,
    agents,
    priority_count: priority.length,
    low_count: lows.length,
  };
}
