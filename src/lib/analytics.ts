import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics] NEXT_PUBLIC_POSTHOG_KEY missing — tracking disabled");
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    session_recording: {
      maskAllInputs: true,
    },
  });

  posthog.register({
    product: "scanlead",
  });

  initialized = true;
}

export function trackPageView(path?: string) {
  if (!initialized) return;
  posthog.capture("$pageview", {
    $current_url: path ?? window.location.href,
  });
}

export function trackEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
}) {
  if (!initialized) return;
  posthog.identify(user.id, {
    email: user.email || undefined,
    name: user.name || undefined,
    plan: user.plan || "free",
    product: "scanlead",
  });
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
