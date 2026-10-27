import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeScanForm } from "@/components/HomeScanForm";
import { HomeSpecialistMock } from "@/components/HomeSpecialistMock";
import { McpSamplePrompt } from "@/components/McpSamplePrompt";
import { McpHomeCtas } from "@/components/McpHomeCtas";
import { UPGRADE_FORM_URL } from "@/lib/forms";

const CHECKS = [
  { title: "Recon & headers", body: "Reachability, stack fingerprint, TLS and security header hygiene." },
  { title: "Leaks & secrets", body: ".env, git, backups, plus secret patterns in public JavaScript." },
  { title: "Auth & session", body: "Login surfaces, cookie flags, OAuth/JWKS misconfig hints." },
  { title: "Input hygiene", body: "Benign empty/oversize/type probes — no exploit payloads." },
  { title: "Access & CSRF", body: "Unauth API/ID hints, CSRF gaps, safe XSS reflection, SSRF param signals." },
  { title: "Auth & TLS", body: "Login/reset enumeration cues, MFA hints, cert expiry and obsolete TLS." },
  { title: "Cloud, stack & DNS", body: "Buckets, admin paths, version signals, SPF/DMARC and DNS hygiene." },
];

const NEVER = [
  { t: "No unauthorized targets", b: "Every run needs an ownership attestation before probes start." },
  { t: "No password sprays", b: "We never brute-force logins or credential-stuff accounts." },
  { t: "No exploit payloads", b: "Detect-only HTTP, DNS, and port checks — evidence, not exploitation." },
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
        {/* Hero — brand + scan form */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5">
          <p className="animate-rise kicker text-[11px] tracking-[0.16em]">
            Authorized external checks
          </p>
          <h1 className="animate-rise-delay mt-1.5 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl md:text-[3.5rem]">
            ScanLead
          </h1>
          <p className="animate-rise-delay mt-2.5 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Authorized detect-only scans. A company brief—not a letter grade.
          </p>

          <div
            id="scan"
            className="surface animate-rise-delay-2 mt-5 max-w-3xl scroll-mt-24 p-4 shadow-[0_1px_0_rgba(19,32,26,0.04)] sm:mt-6 sm:p-5"
          >
            <Suspense fallback={<p className="font-mono text-sm text-[var(--muted)]">Loading form…</p>}>
              <HomeScanForm />
            </Suspense>
          </div>
        </section>

        {/* MCP Agent */}
        <section
          id="mcp"
          className="scroll-mt-24 relative overflow-hidden border-t border-[var(--brand)]/20 bg-[var(--brand-deep)] text-[#e8f0eb]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `
                radial-gradient(700px 380px at 8% 20%, rgba(26,143,106,0.45) 0%, transparent 55%),
                radial-gradient(560px 320px at 96% 80%, rgba(228,243,236,0.12) 0%, transparent 50%)
              `,
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--accent)]/25 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b8f0d4]">
                  New
                </span>
                <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d5ebe1]">
                  MCP Agent
                </span>
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl md:text-4xl">
                Run ScanLead from your agent
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b7c9bf] sm:text-base">
                Sign in with Google, create an API key under MCP Agents, connect{" "}
                <code className="font-mono text-sm text-white">scanlead-mcp</code>, then paste a
                prompt like the sample. Free includes 1 MCP scan after login.
              </p>
              <McpHomeCtas />
            </div>
            <McpSamplePrompt dark />
          </div>
        </section>

        {/* What we never do */}
        <section className="border-t border-[var(--line)] bg-[var(--ink)] text-[#e8f0eb]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:gap-8 sm:px-8 sm:py-12">
            {NEVER.map((item) => (
              <div key={item.t}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                  Never
                </p>
                <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-lg tracking-tight sm:text-xl">
                  {item.t}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#b7c9bf]">{item.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why ScanLead */}
        <section id="why" className="scroll-mt-24 border-t border-[var(--line)] bg-white/70 py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="kicker text-[11px] tracking-[0.16em]">Why ScanLead</p>
            <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
              Built for the gap between a free grade and an enterprise platform.
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
                  Not another letter grade
                </h3>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">
                  Header and TLS checkers stop at A–F. ScanLead runs specialist agents across
                  secrets, auth surfaces, DNS/email, stack signals, and more—then writes one
                  narrative brief your team can act on.
                </p>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
                  Not an enterprise scanner
                </h3>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">
                  No sales cycle, no asset sprawl, no continuous platform to babysit. Paste a URL
                  you own, watch specialists engage, leave with a shareable company brief.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Specialists live */}
        <section className="border-t border-[var(--line)] py-12 sm:py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)]">
                Specialists, live
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
                One agent at a time—not a silent spinner.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                See what’s probing now, what cleared, and what’s next. The scan feels like a real
                engagement, because it is: parallel specialists reporting in as they finish.
              </p>
              <Link href="/#scan" className="btn-secondary mt-6">
                Run a scan →
              </Link>
            </div>
            <HomeSpecialistMock />
          </div>
        </section>

        {/* Company-ready brief */}
        <section className="border-t border-[var(--line)] bg-white/60 py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)]">
              Deliverable
            </p>
            <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
              A company-ready brief you can share.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              Severity, evidence, fixes, and a short abuse-path story—written for engineering and
              leadership, not a raw scanner dump.
            </p>

            <div className="surface mt-8 shadow-[0_1px_0_rgba(19,32,26,0.04)]">
              <div className="border-b border-[var(--line)]/80 px-5 py-4 sm:px-6">
                <p className="kicker">Security brief</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
                  example.com — detect-only pass
                </p>
              </div>
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5 border-b border-[var(--line)]/70 px-5 py-6 sm:px-6 lg:border-b-0 lg:border-r">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--warn)]">
                      Medium
                    </p>
                    <p className="mt-1 font-semibold text-[var(--ink)]">Missing Strict-Transport-Security</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Evidence on the apex response. Fix: set HSTS on HTTPS with a long max-age.
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      Low
                    </p>
                    <p className="mt-1 font-semibold text-[var(--ink)]">No DMARC record</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Publish _dmarc with p=none and rua, then tighten after reports.
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
                      Clear
                    </p>
                    <p className="mt-1 font-semibold text-[var(--ink)]">Secrets in public JS</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">No high-confidence secret patterns flagged.</p>
                  </div>
                </div>
                <div className="bg-[var(--brand-soft)]/40 px-5 py-6 sm:px-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand)]">
                    How this could be abused
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-[var(--ink)]/85">
                    <li>Traffic without enforced HTTPS can be downgraded on first visit.</li>
                    <li>Missing email auth makes spoofed mail harder to reject.</li>
                    <li>Priority fix: ship HSTS, then DMARC monitoring.</li>
                  </ol>
                  <p className="mt-6 font-mono text-xs text-[var(--muted)]">
                    Share link · Markdown · HTML / PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What we check */}
        <section id="checks" className="scroll-mt-24 border-t border-[var(--line)] py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="kicker text-[11px] tracking-[0.16em]">Coverage</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
              What we check
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              Detect exposure. Do not exploit. Each pack is a short, auditable probe.
            </p>
            <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-semibold text-[var(--ink)] sm:text-lg">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built for trust */}
        <section id="method" className="border-t border-[var(--line)] bg-white/60 py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
              Built for trust
            </h2>
            <div className="mt-8 grid gap-7 md:grid-cols-3 md:gap-8">
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
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand)]">
                    {item.n}
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold sm:text-lg">{item.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{item.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-[var(--line)] bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
          <span className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            ScanLead
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/pricing" className="hover:text-[var(--ink)]">
              Pricing
            </Link>
            <Link href="/scans" className="hover:text-[var(--ink)]">
              My scans
            </Link>
            <Link href="/settings" className="hover:text-[var(--ink)]">
              MCP Agents
            </Link>
            {UPGRADE_FORM_URL ? (
              <a
                href={UPGRADE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ink)]"
              >
                Feedback
              </a>
            ) : null}
            <span>Authorized targets only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
