import { authHeaders } from "@/lib/session";

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
  owner_id?: string | null;
  claim_token?: string | null;
  parent_scan_id?: string | null;
};

export type ScanListItem = {
  id: string;
  url: string;
  status: string;
  created_at: string;
  finished_at?: string | null;
  summary?: ScanSummary | null;
  parent_scan_id?: string | null;
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
  const res = await fetch("/v1/scans", {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ url, attested }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getScan(id: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}`, {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getReport(id: string): Promise<string> {
  const res = await fetch(`/v1/scans/${id}/report.md`, {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.text();
}

export async function listMyScans(): Promise<{ scans: ScanListItem[]; limit: number; plan: string }> {
  const res = await fetch("/v1/scans", {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function claimScan(id: string, claimToken: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}/claim`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ claim_token: claimToken }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function rescan(id: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}/rescan`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getDiff(previousId: string, currentId: string) {
  const res = await fetch(`/v1/scans/${previousId}/diff/${currentId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createCheckout(interval: "month" | "year" = "month") {
  const res = await fetch("/v1/billing/checkout", {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ interval }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getPlans() {
  const res = await fetch("/v1/billing/plans", { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

const CLAIM_KEY = "scanlead_claim_tokens";

export function rememberClaimToken(scanId: string, token: string) {
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[scanId] = token;
    localStorage.setItem(CLAIM_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function readClaimToken(scanId: string): string | null {
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[scanId] || null;
  } catch {
    return null;
  }
}

export function rememberGuestScan(scan: { id: string; url: string }) {
  try {
    const raw = localStorage.getItem("scanlead_guest_recent");
    const list = raw ? (JSON.parse(raw) as { id: string; url: string; at: string }[]) : [];
    const next = [{ id: scan.id, url: scan.url, at: new Date().toISOString() }, ...list.filter((x) => x.id !== scan.id)].slice(
      0,
      8,
    );
    localStorage.setItem("scanlead_guest_recent", JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readGuestScans(): { id: string; url: string; at: string }[] {
  try {
    const raw = localStorage.getItem("scanlead_guest_recent");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Best-effort: claim guest scans into the account after first login. */
export async function claimGuestScans(): Promise<number> {
  let claimed = 0;
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    for (const [id, token] of Object.entries(map)) {
      try {
        await claimScan(id, token);
        claimed += 1;
        delete map[id];
      } catch {
        /* already owned / expired */
      }
    }
    localStorage.setItem(CLAIM_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return claimed;
}
