export type Finding = {
  agent: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  evidence_url?: string | null;
  evidence_snippet?: string | null;
  explanation?: string | null;
  fix?: string | null;
  tags?: string[];
};

export type AgentSummaryRow = {
  agent: string;
  label: string;
  status: "clear" | "attention" | string;
  note: string;
};

export type AgentProgress = {
  agent: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "failed" | string;
  started_at?: string | null;
  finished_at?: string | null;
};

export type ScanSummary = {
  verdict?: "looks_solid" | "minor_notes" | "issues_found" | string;
  headline?: string;
  all_clear?: boolean;
  stack?: string;
  agents?: AgentSummaryRow[];
  clean?: string[];
  attention?: string[];
  priority_count?: number;
  low_count?: number;
};

export type Scan = {
  id: string;
  url: string;
  status: "queued" | "running" | "done" | "failed" | string;
  created_at: string;
  finished_at?: string | null;
  fingerprint?: Record<string, unknown>;
  findings?: Finding[];
  risk_path?: string | null;
  summary?: ScanSummary | null;
  agents_progress?: AgentProgress[] | null;
  error?: string | null;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join("; ");
    }
    return JSON.stringify(data);
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function createScan(url: string, attested: boolean): Promise<Scan> {
  const res = await fetch("/api/scans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, attested }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getScan(id: string): Promise<Scan> {
  const res = await fetch(`/api/scans/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getReport(id: string): Promise<string> {
  const res = await fetch(`/api/scans/${id}/report`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.text();
}
