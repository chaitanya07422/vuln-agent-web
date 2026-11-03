import Link from "next/link";

export const metadata = {
  title: "Access restricted | ScanLead",
  robots: { index: false, follow: false },
};

export default function AccessRestrictedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef6f1] px-4 py-12 text-[#193128]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(700px 360px at 15% 0%, #d5e9df 0%, transparent 65%), radial-gradient(600px 340px at 95% 100%, #dcece4 0%, transparent 60%)",
        }}
      />

      <section className="relative w-full max-w-lg rounded-2xl border border-[#d7e4dc] bg-white/95 p-7 text-center shadow-[0_18px_60px_rgba(25,49,40,0.08)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8eee8] text-[#a34c35]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3 21 19H3L12 3Z" />
            <path d="M12 9v4" />
            <path d="M12 16.5h.01" />
          </svg>
        </div>

        <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#527568]">
          ScanLead · Access notice
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
          Access restricted
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#61736a] sm:text-base">
          We’re sorry, but access to ScanLead is currently restricted for this
          connection.
        </p>

        <div className="mt-6 rounded-xl border border-[#e2eae5] bg-[#f6f9f7] px-4 py-4 text-left">
          <p className="text-sm leading-6 text-[#40564b]">
            Please use the website responsibly and avoid repeated or excessive
            requests. This helps us keep ScanLead reliable and available for
            everyone.
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#718078]">
          If you believe this restriction was applied by mistake, please contact
          our support team through the website’s feedback channel.
        </p>

        <p className="mt-7 font-mono text-xs text-[#84928b]">
          HTTP 403 · Forbidden
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#d7e4dc] px-4 py-2.5 text-sm font-semibold text-[#315b49] transition hover:bg-[#f3f8f5]"
        >
          Return to ScanLead
        </Link>
      </section>
    </main>
  );
}
