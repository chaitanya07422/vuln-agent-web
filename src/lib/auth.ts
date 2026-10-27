"use client";

import { authHeaders, getAccessToken, setAccessToken } from "@/lib/session";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  plan?: string;
  plan_expires_at?: string | null;
  deep_credits?: number;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return res.statusText || "Request failed";
  }
}

export function googleLoginUrl(): string {
  return "/v1/auth/google";
}

const AUTH_TIMEOUT_MS = 8000;

export async function refreshSession(): Promise<User | null> {
  try {
    const res = await fetch("/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const data = await res.json();
    setAccessToken(data.access_token || null);
    return data.user || null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function fetchMe(): Promise<User | null> {
  try {
    if (!getAccessToken()) {
      return refreshSession();
    }
    const res = await fetch("/v1/auth/me", {
      headers: authHeaders(),
      credentials: "include",
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
    if (res.status === 401) {
      return refreshSession();
    }
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
  setAccessToken(null);
}

export async function authStatus(): Promise<{ google: boolean }> {
  const res = await fetch("/v1/auth/status", { cache: "no-store" });
  if (!res.ok) return { google: false };
  return res.json();
}

export { parseError };
