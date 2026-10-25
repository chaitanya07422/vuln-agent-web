export type Finding = {
  agent: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  evidence_url?: string | null;
  evidence_snippet?: string | null;
  fix?: string | null;
  tags?: string[];
};

export type Scan = {
  id: string;
  url: string;
  status: "queued" | "running" | "done" | "failed" | string;
  created_at: string;
  finished_at?: string | null;
  fingerprint?: Record<string, unknown>;
  findings?: Finding[];
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
