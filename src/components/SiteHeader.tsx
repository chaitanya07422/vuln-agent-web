import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/" className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
        ScanLead
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] sm:flex">
        <a href="#checks" className="transition hover:text-[var(--ink)]">
          What we check
        </a>
        <a href="#method" className="transition hover:text-[var(--ink)]">
          Method
        </a>
        <a
          href="#scan"
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 font-medium text-[var(--brand-deep)] transition hover:border-[var(--brand)]"
        >
          Run a scan
        </a>
      </nav>
    </header>
  );
}
