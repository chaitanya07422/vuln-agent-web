"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { PlanBadge } from "@/components/PlanBadge";
import { RetryBanner } from "@/components/RetryBanner";
import { useAuth } from "@/components/AuthProvider";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  type ApiKeyMeta,
} from "@/lib/api";
import { McpSamplePrompt } from "@/components/McpSamplePrompt";

const MCP_TOOLS = [
  { name: "start_scan", tip: "Start an authorized detect-only scan" },
  { name: "get_scan", tip: "Status, progress, findings" },
  { name: "get_brief", tip: "Markdown company brief" },
  { name: "list_scans", tip: "Your saved scans" },
  { name: "get_quota", tip: "Remaining Free / Pro quota" },
  { name: "retry_scan", tip: "Retry a failed scan" },
];

const MCP_JSON = `{
  "mcpServers": {
    "scanlead": {
      "command": "scanlead-mcp",
      "env": {
        "SCANLEAD_API_URL": "https://vulscan.duckdns.org",
        "SCANLEAD_API_KEY": "sl_live_…"
      }
    }
  }
}`;

export default function SettingsPage() {
  const { user, loading, login } = useAuth();
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [limit, setLimit] = useState(5);
  const [mcpFreeLimit, setMcpFreeLimit] = useState(1);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [freshKey, setFreshKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const isPro = (user?.plan || "").toLowerCase() === "pro";

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError("");
      const data = await listApiKeys();
      setKeys(data.keys || []);
      setLimit(data.limit ?? 5);
      setMcpFreeLimit(data.mcp_free_limit ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  async function onCreate() {
    setBusy(true);
    setError("");
    setFreshKey("");
    try {
      const data = await createApiKey(name.trim());
      setKeys(data.keys || []);
      setLimit(data.limit ?? 5);
      setMcpFreeLimit(data.mcp_free_limit ?? 1);
      setFreshKey(data.api_key);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: string) {
    if (!confirm("Revoke this API key? MCP/CLI clients using it will stop working.")) return;
    setBusy(true);
    setError("");
    try {
      const data = await deleteApiKey(id);
      setKeys(data.keys || []);
      if (freshKey) setFreshKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onCopy() {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function onCopyJson() {
    try {
      await navigator.clipboard.writeText(MCP_JSON);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      setError("Could not copy mcp.json");
    }
  }

  return (
    <PageShell narrow>
      <div className="animate-rise">
        <p className="kicker">Account</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="display text-4xl">Settings</h1>
          {user && <PlanBadge plan={user.plan} />}
        </div>
        <p className="mt-3 max-w-xl text-[var(--muted)] leading-relaxed">
          MCP requires a Google-signed-in account — including the Free 1 MCP scan. Keys are bound
          to this login; your agent authenticates with the key only (no Google popup).
        </p>

        {loading ? (
          <p className="mt-10 font-mono text-sm text-[var(--muted)]">Loading…</p>
        ) : !user ? (
          <div className="surface mt-10 overflow-hidden">
            <div className="border-b border-[var(--brand)]/15 bg-[var(--brand-soft)]/60 px-5 py-4 sm:px-6">
              <span className="chip chip-brand">New · MCP Agent</span>
              <h2 className="mt-2 display text-2xl">Google sign-in required</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Sign in with Google, then create an API key. That key maps every Cursor scan back to
                this account (quotas, My scans, ownership attestation).
              </p>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <ol className="space-y-2 text-sm text-[var(--muted)]">
                <li>
                  <span className="font-semibold text-[var(--ink)]">1.</span> Continue with Google
                </li>
                <li>
                  <span className="font-semibold text-[var(--ink)]">2.</span> Create <code className="font-mono text-xs">sl_live_…</code> key
                </li>
                <li>
                  <span className="font-semibold text-[var(--ink)]">3.</span> Paste into Cursor{" "}
                  <code className="font-mono text-xs">mcp.json</code>
                </li>
              </ol>
              <button type="button" onClick={login} className="btn-primary">
                Continue with Google
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {/* Highlighted MCP agent banner */}
            <section className="relative overflow-hidden rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand-soft)] via-white to-[var(--mesh-a)] p-5 shadow-[0_1px_0_rgba(11,107,79,0.06)] sm:p-7">
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[var(--brand)]/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip chip-brand">MCP Agent</span>
                    <span className="chip chip-muted">Any MCP client · CLI</span>
                  </div>
                  <h2 className="mt-3 display text-2xl sm:text-3xl">ScanLead in your agent</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Signed in as{" "}
                    <span className="font-medium text-[var(--ink)]">
                      {user.email || user.name || "your Google account"}
                    </span>
                    . Keys you create here run MCP scans as this account — results land in My
                    scans.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--brand)]/20 bg-white/80 px-4 py-3 backdrop-blur-sm">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
                    Your MCP quota
                  </p>
                  {isPro ? (
                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                      Shared with web · Pro pool
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                      {mcpFreeLimit} Free MCP scan
                      <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">
                        Login required · separate from web Free
                      </span>
                    </p>
                  )}
                  {!isPro && (
                    <Link href="/pricing" className="mt-2 inline-block text-xs font-semibold text-[var(--brand-deep)] underline-offset-2 hover:underline">
                      Upgrade for shared Pro limit →
                    </Link>
                  )}
                </div>
              </div>
              <ul className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {MCP_TOOLS.map((t) => (
                  <li
                    key={t.name}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <p className="font-mono text-xs font-semibold text-[var(--brand-deep)]">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{t.tip}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* API keys — create / list / revoke */}
            <section className="surface p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="kicker">Credentials</p>
                  <h2 className="mt-1 display text-2xl">API keys</h2>
                  <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                    Create a key, paste it as{" "}
                    <code className="font-mono text-xs text-[var(--ink)]">SCANLEAD_API_KEY</code> in
                    your agent MCP config. Shown once at creation — revoke anytime.
                  </p>
                </div>
                <p className="font-mono text-xs text-[var(--muted)]">
                  {keys.length}/{limit} keys
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm">
                  <span className="text-[var(--muted)]">Label (optional)</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cursor laptop"
                    maxLength={64}
                    className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || keys.length >= limit}
                  onClick={() => void onCreate()}
                  className="btn-primary shrink-0"
                >
                  {busy ? "Creating…" : "Create API key"}
                </button>
              </div>

              {freshKey && (
                <div className="mt-5 animate-rise rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)]/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip chip-brand">Copy now</span>
                    <p className="text-sm font-semibold text-[var(--brand-deep)]">
                      You won&apos;t see this secret again
                    </p>
                  </div>
                  <p className="mt-3 break-all rounded-lg bg-white/80 px-3 py-2.5 font-mono text-xs leading-relaxed text-[var(--ink)]">
                    {freshKey}
                  </p>
                  <button type="button" onClick={() => void onCopy()} className="btn-secondary mt-3">
                    {copied ? "Copied" : "Copy key"}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4">
                  <RetryBanner
                    message={error}
                    retryLabel="Retry load"
                    onRetry={() => {
                      setError("");
                      setReloadTick((n) => n + 1);
                    }}
                  />
                </div>
              )}

              <ul className="mt-6 divide-y divide-[var(--line)]/70">
                {keys.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)]/50 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-[var(--ink)]">No keys yet</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Create one above to unlock the MCP Agent.
                    </p>
                  </li>
                ) : (
                  keys.map((k) => (
                    <li
                      key={k.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-[var(--ink)]">
                          {k.prefix}…
                          {k.name ? (
                            <span className="text-[var(--muted)]"> · {k.name}</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          Created {k.created_at ? new Date(k.created_at).toLocaleString() : "—"}
                          {k.last_used_at
                            ? ` · last used ${new Date(k.last_used_at).toLocaleString()}`
                            : " · never used"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onRevoke(k.id)}
                        className="btn-ghost text-[var(--danger)]"
                      >
                        Revoke
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <McpSamplePrompt />

            {/* MCP config */}
            <section className="surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="kicker">Config</p>
                  <h2 className="mt-1 display text-xl">mcp.json</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Drop into <code className="font-mono text-xs">~/.cursor/mcp.json</code> (or
                    project <code className="font-mono text-xs">.cursor/mcp.json</code>). Install{" "}
                    <code className="font-mono text-xs">scanlead-mcp</code> via{" "}
                    <code className="font-mono text-xs">pip install -e .</code> from the API repo.
                  </p>
                </div>
                <button type="button" onClick={() => void onCopyJson()} className="btn-secondary shrink-0">
                  {copiedJson ? "Copied" : "Copy config"}
                </button>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--ink)]/95 p-4 font-mono text-[11px] leading-relaxed text-[#e8f0eb]">
                {MCP_JSON}
              </pre>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Only scan URLs you own or are authorized to test.
              </p>
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
