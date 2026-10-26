import { SiteHeader } from "@/components/SiteHeader";
import { ScanForm } from "@/components/ScanForm";

const CHECKS = [
  { title: "Recon & fingerprint", body: "Headers, tech tags, and surface map before deeper probes." },
  { title: "Leaks & config", body: ".env, git metadata, backups, docs, and tech-specific paths." },
  { title: "Auth surfaces", body: "Public user enum and XML-RPC-style endpoints when the stack matches." },
  { title: "CORS & APIs", body: "Origin reflection and publicly reachable API documentation." },
  { title: "Upload & staging", body: "Unauth upload gates and staging hosts linked from production." },
  { title: "Ports & mail", body: "One-shot port presence and mail-related host resolution." },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(1000px 520px at 12% -8%, var(--mesh-a) 0%, transparent 58%),
            radial-gradient(800px 420px at 92% 4%, #cfe4da 0%, transparent 52%),
            linear-gradient(180deg, #eef6f1 0%, var(--bg) 42%, #f7faf8 100%)
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

      <main>
        <section className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl flex-col justify-center px-5 pb-16 pt-4 sm:px-8">
          <p className="animate-rise font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
            Authorized external checks
          </p>
          <h1 className="animate-rise-delay mt-3 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.04] tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
            ScanLead
          </h1>
          <p className="animate-rise-delay mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
            Paste a URL you own. Specialist agents return a company-ready brief you can save and
            share.
          </p>

          <div id="scan" className="mt-10 max-w-3xl scroll-mt-24">
            <ScanForm />
          </div>
        </section>

        <section id="checks" className="border-t border-[var(--line)] bg-white/60 py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              What we check
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Detect exposure. Do not exploit. Each pack is a short, auditable probe.
            </p>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map((item) => (
                <div key={item.title}>
                  <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="method" className="border-t border-[var(--line)] py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              Built for trust
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Ownership attestation",
                  b: "Every scan requires an explicit checkbox that you own or are authorized to test the target.",
                },
                {
                  n: "02",
                  t: "One-shot probes",
                  b: "No credential stuffing. Findings come from limited HTTP, DNS, and port checks.",
                },
                {
                  n: "03",
                  t: "Company-ready brief",
                  b: "Severity, evidence, fixes, and a checklist you can share with your team.",
                },
              ].map((item) => (
                <div key={item.n}>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand)]">
                    {item.n}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{item.t}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--muted)]">{item.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-white/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            ScanLead
          </span>
          <p>Use only on systems you are authorized to assess.</p>
        </div>
      </footer>
    </div>
  );
}
