"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PlanBadge } from "@/components/PlanBadge";
import { useScanLiveLock } from "@/components/ScanLiveLock";

export function SiteHeader() {
  const { user, loading, login, logout } = useAuth();
  const pathname = usePathname();
  const scanLocked = useScanLiveLock();

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `text-sm transition hover:text-[var(--ink)] ${
      active ? "font-medium text-[var(--ink)]" : "text-[var(--muted)]"
    }`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)]/70 bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
        {scanLocked ? (
          <span
            className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] opacity-60 sm:text-2xl"
            title="Stay on this scan until it finishes"
          >
            ScanLead
          </span>
        ) : (
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl"
          >
            ScanLead
          </Link>
        )}
        <nav className="flex items-center gap-3 sm:gap-5">
          {scanLocked ? (
            <>
              <span className="hidden text-sm text-[var(--muted)] opacity-40 sm:inline">Why</span>
              <span className="hidden text-sm text-[var(--muted)] opacity-40 md:inline">Checks</span>
              <span className="text-sm text-[var(--muted)] opacity-40">Pricing</span>
              {user ? (
                <>
                  <span className="text-sm text-[var(--muted)] opacity-40">My scans</span>
                  <div className="flex items-center gap-2 border-l border-[var(--line)]/80 pl-3 sm:pl-4">
                    {user.plan === "pro" && <PlanBadge plan="pro" size="sm" />}
                    {user.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.picture}
                        alt=""
                        className="h-8 w-8 rounded-full border border-[var(--line)] object-cover opacity-70"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-deep)] opacity-70">
                        {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted)] opacity-40 sm:inline">
                      Sign out
                    </span>
                  </div>
                </>
              ) : (
                <span className="rounded-full border border-[var(--line)] bg-white/60 px-3.5 py-1.5 text-sm font-medium text-[var(--muted)] opacity-50 sm:px-4 sm:py-2">
                  Sign in
                </span>
              )}
            </>
          ) : (
            <>
              <Link
                href="/#why"
                className="hidden text-sm text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline"
              >
                Why
              </Link>
              <Link
                href="/#checks"
                className="hidden text-sm text-[var(--muted)] transition hover:text-[var(--ink)] md:inline"
              >
                Checks
              </Link>
              <Link href="/pricing" className={linkClass("/pricing")}>
                Pricing
              </Link>
              {user ? (
                <>
                  <Link href="/scans" className={linkClass("/scans")}>
                    My scans
                  </Link>
                  <Link href="/settings" className={linkClass("/settings")} title="API keys · MCP Agent">
                    Settings
                  </Link>
                  <div className="flex items-center gap-2 border-l border-[var(--line)]/80 pl-3 sm:pl-4">
                    {user.plan === "pro" && <PlanBadge plan="pro" size="sm" />}
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
                      className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-white/80 hover:text-[var(--ink)] sm:inline"
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
                  className="rounded-full border border-[var(--line)] bg-white/90 px-3.5 py-1.5 text-sm font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] hover:bg-white disabled:opacity-50 sm:px-4 sm:py-2"
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
