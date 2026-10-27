"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { UPGRADE_FORM_URL } from "@/lib/forms";

export { UPGRADE_FORM_URL };

export function UpgradeInterestModal({
  open,
  onClose,
  intent = "pro",
}: {
  open: boolean;
  onClose: () => void;
  intent?: "pro" | "deep";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    trackEvent("upgrade_interest_open", { intent });
    // Blur the Upgrade CTA so its focus ring doesn’t sit under the dialog
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose, intent]);

  if (!open) return null;

  const planLabel = intent === "deep" ? "a deep brief" : "Pro";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-interest-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade bg-[var(--ink)]/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_28px_70px_rgba(19,32,26,0.16)]"
      >
        <div className="px-6 pb-6 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] outline-none hover:bg-[var(--bg)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            Esc
          </button>
          <p className="kicker text-[11px]">Payments</p>
          <h2
            id="upgrade-interest-title"
            className="mt-2 max-w-[16ch] display text-[1.75rem] leading-tight sm:text-[1.85rem]"
          >
            We’re still working on this
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
            Checkout for {planLabel} isn’t live yet. Take a minute on this short form — tell us what
            you need, and we’ll follow up personally.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {UPGRADE_FORM_URL ? (
              <a
                href={UPGRADE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("upgrade_interest_form_click", { intent })}
                className="btn-primary w-full outline-none ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-deep)] focus-visible:ring-offset-2"
              >
                Open interest form
              </a>
            ) : (
              <p className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]">
                Interest form link isn’t configured yet. Email us and we’ll get you set up.
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
