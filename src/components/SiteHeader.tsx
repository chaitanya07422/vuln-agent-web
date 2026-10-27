"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PlanBadge } from "@/components/PlanBadge";
import { useScanLiveLock } from "@/components/ScanLiveLock";
import { UPGRADE_FORM_URL } from "@/components/UpgradeInterestModal";
import { trackEvent } from "@/lib/analytics";

export function SiteHeader() {
  const { user, loading, login, logout } = useAuth();
  const pathname = usePathname();
  const scanLocked = useScanLiveLock();

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `shrink-0 text-sm transition hover:text-[var(--ink)] ${
      active ? "font-medium text-[var(--ink)]" : "text-[var(--muted)]"
    }`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)]/40 bg-[#eef6f1]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-8 sm:py-3">
        {scanLocked ? (
          <span
            className="shrink-0 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] opacity-60 sm:text-2xl"
            title="Stay on this scan until it finishes"
          >
            ScanLead
          </span>
        ) : (
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl"
          >
            ScanLead
          </Link>
        )}

        <nav className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3.5">
          {scanLocked ? (
            <>
              <span className="hidden text-sm text-[var(--muted)] opacity-40 md:inline">Pricing</span>
              {user?.plan === "pro" && <PlanBadge plan="pro" size="sm" />}
              <span className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-sm text-[var(--muted)] opacity-50">
                Scanning…
              </span>
            </>
          ) : (
            <>
              <Link
                href="/#why"
                className="hidden shrink-0 text-sm text-[var(--muted)] transition hover:text-[var(--ink)] md:inline"
              >
                Why
              </Link>
              <Link href="/pricing" className={`hidden sm:inline ${linkClass("/pricing")}`}>
                Pricing
              </Link>
              {UPGRADE_FORM_URL ? (
                <a
                  href={UPGRADE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("feedback_click", { source: "header" })}
                  className="shrink-0 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  Feedback
                </a>
              ) : null}
              <Link
                href="/settings"
                onClick={() => trackEvent("mcp_nav_click", { source: "header" })}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-deep)] transition hover:border-[var(--brand)] sm:px-2.5 sm:text-xs ${
                  pathname.startsWith("/settings") ? "ring-1 ring-[var(--brand)]/35" : ""
                }`}
                title="API keys for Cursor MCP"
              >
                <span className="scan-pulse inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span className="sm:hidden">MCP</span>
                <span className="hidden sm:inline">MCP Agents</span>
              </Link>
              {user ? (
                <>
                  <Link href="/scans" className={`hidden sm:inline ${linkClass("/scans")}`}>
                    My scans
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 border-l border-[var(--line)]/70 pl-2.5 sm:pl-3">
                    {user.plan === "pro" && (
                      <span className="hidden sm:inline">
                        <PlanBadge plan="pro" size="sm" />
                      </span>
                    )}
                    {user.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.picture}
                        alt=""
                        className="h-8 w-8 rounded-full border border-[var(--line)] object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-deep)]">
                        {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="hidden rounded-lg px-2 py-1 text-xs font-medium text-[var(--muted)] hover:bg-white/80 hover:text-[var(--ink)] md:inline"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={login}
                  className="shrink-0 rounded-full border border-[var(--line)] bg-white/95 px-3 py-1.5 text-sm font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] hover:bg-white disabled:opacity-50 sm:px-3.5"
                >
                  Sign in
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
