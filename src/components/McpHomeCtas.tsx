"use client";

import { useAuth } from "@/components/AuthProvider";
import { TrackLink } from "@/components/TrackLink";
import { trackEvent } from "@/lib/analytics";

/** Auth-aware CTAs for the homepage MCP section. */
export function McpHomeCtas() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="mt-8 h-12 w-48 animate-pulse rounded-xl bg-white/10" aria-hidden />
    );
  }

  if (user) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <TrackLink
          href="/settings"
          event="mcp_cta_click"
          eventProps={{ target: "mcp_agents", source: "home_mcp", signed_in: true }}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[var(--brand-deep)] transition hover:bg-[#e8f0eb]"
        >
          Open MCP Agents
        </TrackLink>
        <TrackLink
          href="/pricing"
          event="mcp_cta_click"
          eventProps={{ target: "pricing", source: "home_mcp", signed_in: true }}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          View plans
        </TrackLink>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => {
          trackEvent("mcp_cta_click", { target: "signup", source: "home_mcp", signed_in: false });
          login();
        }}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[var(--brand-deep)] transition hover:bg-[#e8f0eb]"
      >
        Sign in · get API key
      </button>
      <TrackLink
        href="/pricing"
        event="mcp_cta_click"
        eventProps={{ target: "pricing", source: "home_mcp", signed_in: false }}
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Free · 1 MCP after login
      </TrackLink>
    </div>
  );
}
