"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export function AuthModal({
  open,
  onClose,
  title = "Sign in to continue",
  body = "One Google account. History, share links, and exports stay with you.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  body?: string;
}) {
  const { login } = useAuth();

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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
        <p className="kicker text-[11px]">Account</p>
        <h2
          id="auth-modal-title"
          className="mt-2 display text-[1.85rem] leading-tight"
        >
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{body}</p>
        <button
          type="button"
          onClick={login}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--ink)] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
        >
          <GoogleMark />
          Continue with Google
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
          New here? Signing in unlocks 2 full Free briefs, then locked previews until you upgrade.
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 37.1 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
