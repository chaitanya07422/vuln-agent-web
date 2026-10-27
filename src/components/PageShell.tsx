"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export function PageShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(920px 480px at 8% -12%, var(--mesh-a) 0%, transparent 55%),
            radial-gradient(700px 380px at 96% 0%, #d7e8df 0%, transparent 50%),
            linear-gradient(180deg, #eef6f1 0%, var(--bg) 48%, #f7faf8 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.45), transparent 62%)",
        }}
      />
      <SiteHeader />
      <main
        className={`mx-auto w-full flex-1 px-5 pb-16 pt-6 sm:px-8 sm:pt-8 ${
          narrow ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </main>
      <footer className="mt-auto border-t border-[var(--line)]/80 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]"
          >
            ScanLead
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/pricing" className="hover:text-[var(--ink)]">
              Pricing
            </Link>
            <Link href="/scans" className="hover:text-[var(--ink)]">
              My scans
            </Link>
            <span>Authorized targets only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
