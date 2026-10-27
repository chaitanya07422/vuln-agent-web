import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { ScanLiveLockProvider } from "@/components/ScanLiveLock";
import { AnalyticsPageViews, PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ScanLead — Authorized detect-only website scans",
  description:
    "Authorized detect-only scans. Specialist agents return a company brief—not a letter grade. Paste a URL you own; sign in to save, share, and export.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        <PostHogProvider>
          <AuthProvider>
            <ScanLiveLockProvider>
              <Suspense fallback={null}>
                <AnalyticsPageViews />
              </Suspense>
              {children}
            </ScanLiveLockProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
