"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PlanBadge } from "@/components/PlanBadge";

export function SiteHeader() {
  const { user, loading, login, logout } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `transition hover:text-[var(--ink)] ${
      active ? "text-[var(--ink)]" : "text-[var(--muted)]"
    }`;
  };

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
      >
        ScanLead
      </Link>
      <nav className="flex items-center gap-3 text-sm sm:gap-6">
        <Link href="/#checks" className="hidden text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline">
          What we check
        </Link>
        <Link href="/pricing" className={`hidden sm:inline ${linkClass("/pricing")}`}>
          Pricing
        </Link>
        {user ? (
          <>
            <Link href="/scans" className={linkClass("/scans")}>
              My scans
            </Link>
            <div className="flex items-center gap-2.5 pl-1">
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
                className="rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--line)] hover:bg-white hover:text-[var(--ink)]"
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
            className="rounded-full border border-[var(--line)] bg-white/90 px-4 py-2 font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] hover:bg-white disabled:opacity-50"
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}
