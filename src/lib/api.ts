import { authHeaders, setAccessToken } from "@/lib/session";

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
  detail_level?: "full" | "teaser" | string;
  hidden_findings?: number;
  findings_total?: number;
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

export type QuotaInfo = {
  mode: "guest" | "free" | "pro" | string;
  limit: number;
  used: number;
  remaining: number;
  can_scan: boolean;
  deep_credits?: number;
  guest_lifetime?: number;
  free_limit?: number;
  full_limit?: number;
  full_used?: number;
  full_remaining?: number;
  next_detail?: "full" | "teaser" | string;
};

export type QuotaErrorCode = "GUEST_QUOTA_EXCEEDED" | "FREE_QUOTA_EXCEEDED" | string;

export class ApiError extends Error {
  status: number;
  code?: QuotaErrorCode;
  upgrade?: { pro?: boolean; deep?: boolean; signin?: boolean };

  constructor(
    message: string,
    opts: { status: number; code?: QuotaErrorCode; upgrade?: ApiError["upgrade"] },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.upgrade = opts.upgrade;
  }
}

async function parseError(res: Response): Promise<Error> {
  try {
    const data = await res.json();
    const detail = data?.detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      return new ApiError(String(detail.message || detail.code || "Request failed"), {
        status: res.status,
        code: detail.code,
        upgrade: detail.upgrade,
      });
    }
    if (typeof detail === "string") return new ApiError(detail, { status: res.status });
    if (Array.isArray(detail)) {
      return new ApiError(
        detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join("; "),
        { status: res.status },
      );
    }
    return new ApiError(JSON.stringify(data), { status: res.status });
  } catch {
    return new ApiError(res.statusText || "Request failed", { status: res.status });
  }
}

export async function createScan(url: string, attested: boolean): Promise<Scan> {
  const res = await fetch("/v1/scans", {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ url, attested }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getQuota(): Promise<QuotaInfo> {
  const res = await fetch("/v1/scans/quota", {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  // Stale access token → treat as guest (don't break homepage quota chips).
  if (res.status === 401) {
    setAccessToken(null);
    const guest = await fetch("/v1/scans/quota", {
      cache: "no-store",
      credentials: "include",
    });
    if (!guest.ok) throw await parseError(guest);
    return guest.json();
  }
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getScan(id: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}`, {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getReport(id: string): Promise<string> {
  const res = await fetch(`/v1/scans/${id}/report.md`, {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.text();
}

export async function listMyScans(): Promise<{ scans: ScanListItem[]; limit: number; plan: string }> {
  const res = await fetch("/v1/scans", {
    cache: "no-store",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function claimScan(id: string, claimToken: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}/claim`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ claim_token: claimToken }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function rescan(id: string): Promise<Scan> {
  const res = await fetch(`/v1/scans/${id}/rescan`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getDiff(previousId: string, currentId: string) {
  const res = await fetch(`/v1/scans/${previousId}/diff/${currentId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function createCheckout(
  interval: "month" | "year" | "once" = "month",
  planId?: string,
): Promise<{
  checkout_url: string;
  provider?: string;
  mock?: boolean;
  plan_id?: string;
}> {
  const res = await fetch("/v1/billing/checkout", {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ interval, plan_id: planId }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function syncBilling() {
  const res = await fetch("/v1/billing/sync", {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function getPlans() {
  const res = await fetch("/v1/billing/plans", { cache: "no-store" });
  if (!res.ok) throw await parseError(res);
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
    // Also try tokens for recent guest scans (same map, but ensure recent ids are covered).
    for (const recent of readGuestScans()) {
      if (!map[recent.id]) {
        const t = readClaimToken(recent.id);
        if (t) map[recent.id] = t;
      }
    }
    for (const [id, token] of Object.entries(map)) {
      try {
        await claimScan(id, token);
        claimed += 1;
        delete map[id];
      } catch {
        /* already owned / expired — drop dead tokens */
        delete map[id];
      }
    }
    localStorage.setItem(CLAIM_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return claimed;
}
