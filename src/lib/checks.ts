import type { Finding, Scan, ScanSummary, AgentSummaryRow } from "@/lib/api";

/** Canonical checklist shown even if the API summary is missing (old server). */
export const CHECK_CATALOG: { agent: string; label: string; does: string }[] = [
  { agent: "recon", label: "Recon & fingerprint", does: "Reachability, headers, tech stack" },
  { agent: "js_audit", label: "Frontend JS review", does: "Bundles for upload/resume/MIME risks" },
  { agent: "users", label: "User / author exposure", does: "Public user listing (e.g. WP REST)" },
  { agent: "auth", label: "Auth surfaces", does: "XML-RPC / login-style endpoints" },
  { agent: "leaks", label: "Leaks & leftover files", does: ".env, git, backups, readme, docs" },
  { agent: "cors_api", label: "CORS & public APIs", does: "Origin reflection, open API docs" },
  { agent: "upload", label: "Upload & file routes", does: "Presign/upload JSON APIs, object URLs" },
  { agent: "uat_app", label: "Staging / UAT links", does: "Non-prod hosts linked from production" },
  { agent: "ports_mail", label: "Ports & mail", does: "Risky ports (not normal 80/443), mail hosts" },
  { agent: "tls_headers", label: "TLS & security headers", does: "HSTS, CSP, framing, MIME sniffing" },
  { agent: "cloud_storage", label: "Cloud storage exposure", does: "Public bucket / directory listing hints" },
  { agent: "admin_panels", label: "Admin panel surfaces", does: "Stack-keyed admin/login path one-shots" },
  { agent: "email_spoof", label: "Email auth (SPF/DMARC)", does: "SPF, DMARC, common DKIM selectors" },
  { agent: "js_secrets", label: "Secrets in public JS", does: "API keys, tokens, Firebase configs" },
  { agent: "sitemap_crawl", label: "Robots & sitemap paths", does: "Capped sitemap discovery + sensitive paths" },
  { agent: "graphql", label: "GraphQL surface", does: "Endpoint detect + safe introspection probe" },
  { agent: "websocket", label: "WebSocket endpoints", does: "ws/wss references from HTML/JS" },
  { agent: "cookie_flags", label: "Cookie security flags", does: "Secure, HttpOnly, SameSite on Set-Cookie" },
  { agent: "oauth_misconfig", label: "OAuth frontend config", does: "redirect_uri / client_secret in JS" },
  { agent: "jwt_public", label: "JWKS / OIDC discovery", does: "Public keys and alg advertisements" },
  { agent: "redirect_open", label: "Open redirect checks", does: "Login/OAuth redirect parameters" },
  { agent: "http_methods", label: "HTTP method hygiene", does: "OPTIONS/TRACE and dangerous verbs" },
  { agent: "cors_creds", label: "CORS + credentials", does: "ACAO reflection with credentials" },
  { agent: "subdomain_hint", label: "Subdomain hints", does: "HTML/DNS hints — no mass brute" },
  { agent: "dns_hygiene", label: "DNS hygiene", does: "Dangling CNAME + AXFR refuse check" },
  { agent: "caa_dnssec", label: "CAA & DNSSEC", does: "Certificate authority + DNSSEC presence" },
  { agent: "cdn_origin", label: "CDN / origin leakage", does: "Internal headers and verbose errors" },
  { agent: "wordpress_deep", label: "WordPress deep checks", does: "Users, xmlrpc, debug.log (when WP)" },
  { agent: "next_react", label: "Next.js / React checks", does: "Source maps and public env (when matched)" },
  { agent: "spring_java", label: "Spring actuator", does: "Actuator one-shots when exposed" },
  { agent: "firebase", label: "Firebase exposure", does: "Open RTDB/Storage hints from config" },
  { agent: "cache_poison_hint", label: "Cache poison hints", does: "Unkeyed forwarded-header reflection" },
  { agent: "rate_limit_probe", label: "Rate-limit probe", does: "Soft 5-request burst on auth-like paths" },
  { agent: "dependency_meta", label: "Manifests & generator", does: "package.json, generator meta, lockfiles" },
  {
    agent: "input_hygiene",
    label: "Input hygiene",
    does: "Benign empty/oversize/type probes; client-only validation hints",
  },
  { agent: "csrf_forms", label: "CSRF form hygiene", does: "POST forms missing tokens; SameSite gaps" },
  { agent: "access_hint", label: "Unauth access hints", does: "Private-looking APIs / IDs without auth" },
  { agent: "ssrf_hint", label: "SSRF parameter hints", does: "URL params that fetch private/metadata URLs" },
  {
    agent: "xss_reflect_safe",
    label: "XSS reflection (safe)",
    does: "Safe marker reflection + CSP gaps (no exploit payloads)",
  },
  { agent: "auth_enum", label: "Auth enumeration", does: "Login/reset message differentials; MFA cues" },
  { agent: "cve_stack", label: "Version / CVE signals", does: "Public version strings → advisory notes" },
  { agent: "tls_depth", label: "TLS certificate depth", does: "Cert expiry, obsolete TLS, handshake issues" },
  { agent: "adapt", label: "Extra path probes", does: "One-shot paths from stack + JS hints" },
  { agent: "compliance_map", label: "OWASP theme map", does: "Findings mapped to OWASP-style themes" },
  { agent: "executive_brief", label: "Executive brief", does: "Short C-level summary of the pass" },
];

export function buildDisplaySummary(scan: Scan): ScanSummary {
  if (scan.summary?.agents?.length) {
    return scan.summary;
  }

  const findings = (scan.findings || []).filter(
    (f) => f.severity !== "info" && f.agent !== "reporter",
  );
  const byAgent = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byAgent.get(f.agent) || [];
    list.push(f);
    byAgent.set(f.agent, list);
  }

  const fp = scan.fingerprint || {};
  const tags = Array.isArray(fp.tags) ? (fp.tags as string[]).join(", ") : "unknown";

  const agents: AgentSummaryRow[] = CHECK_CATALOG.map((c) => {
    const hits = (byAgent.get(c.agent) || []).filter((f) =>
      ["critical", "high", "medium", "low"].includes(f.severity),
    );
    if (hits.length) {
      return {
        agent: c.agent,
        label: c.label,
        status: "attention",
        note: hits.map((h) => h.title).slice(0, 2).join("; "),
      };
    }
    return {
      agent: c.agent,
      label: c.label,
      status: "clear",
      note: `Checked — ${c.does}`,
    };
  });

  const priority = findings.filter((f) => ["critical", "high", "medium"].includes(f.severity));
  const lows = findings.filter((f) => f.severity === "low");
  let verdict: ScanSummary["verdict"] = "looks_solid";
  let headline =
    "Everything checked looks solid — no critical, high, medium, or low issues in this detect-only pass.";
  let all_clear = true;
  if (priority.length) {
    verdict = "issues_found";
    headline = `Scan finished with ${priority.length} priority issue${priority.length === 1 ? "" : "s"} that need attention.`;
    all_clear = false;
  } else if (lows.length) {
    verdict = "minor_notes";
    headline = `No major vulnerabilities; ${lows.length} minor hygiene note${lows.length === 1 ? "" : "s"} remain.`;
    all_clear = false;
  }

  return {
    verdict,
    headline,
    all_clear,
    stack: tags,
    agents,
    priority_count: priority.length,
    low_count: lows.length,
  };
}
