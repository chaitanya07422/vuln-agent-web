"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    trackEvent("upgrade_interest_open", { intent });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, intent]);

  if (!open) return null;

  const planLabel = intent === "deep" ? "a deep brief" : "Pro";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-interest-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade bg-[var(--ink)]/30 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="animate-scale-in relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-white px-7 py-8 shadow-[0_28px_70px_rgba(19,32,26,0.16)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
        >
          Esc
        </button>
        <p className="kicker text-[11px]">Payments</p>
        <h2
          id="upgrade-interest-title"
          className="mt-2 display text-[1.85rem] leading-tight"
        >
          We’re still working on this
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Checkout for {planLabel} isn’t live yet. Please take a minute to fill this short form —
          tell us what you need so we can serve you better, and we’ll follow up personally.
        </p>
        {UPGRADE_FORM_URL ? (
          <a
            href={UPGRADE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("upgrade_interest_form_click", { intent })}
            className="btn-primary mt-7 flex w-full items-center justify-center"
          >
            Open interest form
          </a>
        ) : (
          <p className="mt-7 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]">
            Interest form link isn’t configured yet. Email us and we’ll get you set up.
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
