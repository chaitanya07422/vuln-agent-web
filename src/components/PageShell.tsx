"use client";

import { SiteHeader } from "@/components/SiteHeader";

export function PageShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
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
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 68%)",
        }}
      />
      <SiteHeader />
      <main
        className={`mx-auto w-full px-5 pb-20 pt-4 sm:px-8 ${
          narrow ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
